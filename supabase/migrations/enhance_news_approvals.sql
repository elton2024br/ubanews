-- Enhance news approvals system for complete editorial workflow
-- Add new columns and improve the approval process

-- Add new columns to news_approvals table
ALTER TABLE news_approvals 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS required_approvals INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_approvals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add workflow status to admin_news if not exists
DO $$
BEGIN
    -- Check if 'pending_approval' status exists in the constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%admin_news_status_check%' 
        AND check_clause LIKE '%pending_approval%'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE admin_news DROP CONSTRAINT IF EXISTS admin_news_status_check;
        
        -- Add the new constraint with additional statuses
        ALTER TABLE admin_news ADD CONSTRAINT admin_news_status_check 
        CHECK (status::text = ANY (ARRAY[
            'draft'::character varying, 
            'pending_approval'::character varying,
            'pending'::character varying, 
            'approved'::character varying,
            'published'::character varying, 
            'rejected'::character varying,
            'archived'::character varying
        ]::text[]));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_approvals_status ON news_approvals(status);
CREATE INDEX IF NOT EXISTS idx_news_approvals_priority ON news_approvals(priority);
CREATE INDEX IF NOT EXISTS idx_news_approvals_deadline ON news_approvals(deadline);
CREATE INDEX IF NOT EXISTS idx_news_approvals_news_id ON news_approvals(news_id);
CREATE INDEX IF NOT EXISTS idx_news_approvals_reviewer_id ON news_approvals(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_admin_news_status ON admin_news(status);
CREATE INDEX IF NOT EXISTS idx_admin_news_author_id ON admin_news(author_id);

-- Create a function to automatically create approval request when news status changes to pending
CREATE OR REPLACE FUNCTION create_approval_request()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to pending_approval, create approval request
    IF NEW.status = 'pending_approval' AND (OLD.status IS NULL OR OLD.status != 'pending_approval') THEN
        INSERT INTO news_approvals (
            news_id,
            status,
            priority,
            deadline,
            required_approvals,
            current_approvals,
            metadata
        ) VALUES (
            NEW.id,
            'pending',
            'normal',
            NOW() + INTERVAL '3 days', -- Default 3 days deadline
            1, -- Default requires 1 approval
            0,
            jsonb_build_object(
                'submitted_by', NEW.author_id,
                'submitted_at', NOW(),
                'news_title', NEW.title,
                'news_category', NEW.category
            )
        )
        ON CONFLICT (news_id) DO UPDATE SET
            status = 'pending',
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic approval request creation
DROP TRIGGER IF EXISTS trigger_create_approval_request ON admin_news;
CREATE TRIGGER trigger_create_approval_request
    AFTER UPDATE ON admin_news
    FOR EACH ROW
    EXECUTE FUNCTION create_approval_request();

-- Create function to handle approval status changes
CREATE OR REPLACE FUNCTION handle_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamps based on status
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_at = NOW();
        NEW.current_approvals = NEW.current_approvals + 1;
        
        -- Update news status to approved if enough approvals
        IF NEW.current_approvals >= NEW.required_approvals THEN
            UPDATE admin_news 
            SET status = 'approved', updated_at = NOW()
            WHERE id = NEW.news_id;
        END IF;
        
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        NEW.rejected_at = NOW();
        
        -- Update news status to rejected
        UPDATE admin_news 
        SET status = 'rejected', updated_at = NOW()
        WHERE id = NEW.news_id;
    END IF;
    
    -- Always update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for approval status changes
DROP TRIGGER IF EXISTS trigger_handle_approval_status_change ON news_approvals;
CREATE TRIGGER trigger_handle_approval_status_change
    BEFORE UPDATE ON news_approvals
    FOR EACH ROW
    EXECUTE FUNCTION handle_approval_status_change();

-- Create a view for approval dashboard
CREATE OR REPLACE VIEW news_approvals_dashboard AS
SELECT 
    na.id as approval_id,
    na.news_id,
    an.title as news_title,
    an.excerpt as news_excerpt,
    an.category as news_category,
    an.featured_image,
    na.status as approval_status,
    na.priority,
    na.deadline,
    na.feedback,
    na.notes,
    na.required_approvals,
    na.current_approvals,
    na.created_at as submitted_at,
    na.updated_at as last_updated,
    na.approved_at,
    na.rejected_at,
    -- Author information
    author.email as author_email,
    author.full_name as author_name,
    author.role as author_role,
    -- Reviewer information
    reviewer.email as reviewer_email,
    reviewer.full_name as reviewer_name,
    reviewer.role as reviewer_role,
    -- Calculated fields
    CASE 
        WHEN na.deadline < NOW() AND na.status = 'pending' THEN true
        ELSE false
    END as is_overdue,
    EXTRACT(EPOCH FROM (na.deadline - NOW()))/3600 as hours_until_deadline,
    na.metadata
FROM news_approvals na
JOIN admin_news an ON na.news_id = an.id
JOIN admin_users author ON an.author_id = author.id
LEFT JOIN admin_users reviewer ON na.reviewer_id = reviewer.id;

-- Grant permissions on the view
GRANT SELECT ON news_approvals_dashboard TO authenticated;

-- Create function to submit news for approval
CREATE OR REPLACE FUNCTION submit_news_for_approval(
    p_news_id UUID,
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    approval_id UUID;
BEGIN
    -- Update news status to pending_approval
    UPDATE admin_news 
    SET status = 'pending_approval', updated_at = NOW()
    WHERE id = p_news_id;
    
    -- Insert or update approval request
    INSERT INTO news_approvals (
        news_id,
        status,
        priority,
        deadline,
        notes,
        required_approvals,
        current_approvals
    ) VALUES (
        p_news_id,
        'pending',
        p_priority,
        COALESCE(p_deadline, NOW() + INTERVAL '3 days'),
        p_notes,
        1,
        0
    )
    ON CONFLICT (news_id) DO UPDATE SET
        status = 'pending',
        priority = p_priority,
        deadline = COALESCE(p_deadline, NOW() + INTERVAL '3 days'),
        notes = p_notes,
        updated_at = NOW()
    RETURNING id INTO approval_id;
    
    RETURN approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to approve/reject news
CREATE OR REPLACE FUNCTION review_news(
    p_approval_id UUID,
    p_action VARCHAR(20), -- 'approve' or 'reject'
    p_reviewer_id UUID,
    p_feedback TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    news_record RECORD;
BEGIN
    -- Validate action
    IF p_action NOT IN ('approve', 'reject') THEN
        RAISE EXCEPTION 'Invalid action. Must be approve or reject';
    END IF;
    
    -- Update approval record
    UPDATE news_approvals 
    SET 
        status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
        reviewer_id = p_reviewer_id,
        feedback = p_feedback,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_approval_id
    RETURNING * INTO news_record;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Approval record not found';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION submit_news_for_approval TO authenticated;
GRANT EXECUTE ON FUNCTION review_news TO authenticated;

-- Add unique constraint to prevent duplicate approval requests
ALTER TABLE news_approvals 
DROP CONSTRAINT IF EXISTS unique_news_approval;

ALTER TABLE news_approvals 
ADD CONSTRAINT unique_news_approval UNIQUE (news_id);

-- Update RLS policies for news_approvals
DROP POLICY IF EXISTS "Admin users can manage approvals" ON news_approvals;
CREATE POLICY "Admin users can manage approvals" ON news_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.email() 
            AND admin_users.is_active = true
        )
    );

COMMENT ON TABLE news_approvals IS 'Enhanced news approval system with complete editorial workflow';
COMMENT ON COLUMN news_approvals.priority IS 'Approval priority: low, normal, high, urgent';
COMMENT ON COLUMN news_approvals.deadline IS 'Deadline for approval decision';
COMMENT ON COLUMN news_approvals.approval_level IS 'Level of approval required (for multi-level approval)';
COMMENT ON COLUMN news_approvals.required_approvals IS 'Number of approvals required';
COMMENT ON COLUMN news_approvals.current_approvals IS 'Current number of approvals received';
COMMENT ON COLUMN news_approvals.metadata IS 'Additional metadata for the approval process';