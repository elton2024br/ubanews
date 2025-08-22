-- Functions to provide aggregated report data

create or replace function news_status_counts(start_date timestamptz, end_date timestamptz)
returns table(status text, count int)
language sql
stable
as $$
    select status, count(*)::int as count
    from admin_news
    where created_at >= start_date and created_at <= end_date
    group by status;
$$;

create or replace function news_by_category(start_date timestamptz, end_date timestamptz)
returns table(category text, count int)
language sql
stable
as $$
    select category, count(*)::int as count
    from admin_news
    where created_at >= start_date and created_at <= end_date
    group by category
    order by count desc;
$$;

create or replace function news_by_month(start_date timestamptz, end_date timestamptz)
returns table(month date, count int)
language sql
stable
as $$
    select date_trunc('month', created_at)::date as month, count(*)::int as count
    from admin_news
    where created_at >= start_date and created_at <= end_date
    group by month
    order by month;
$$;

create or replace function author_news_counts(start_date timestamptz, end_date timestamptz)
returns table(author text, count int)
language sql
stable
as $$
    select au.full_name as author, count(*)::int as count
    from admin_news an
    join admin_users au on au.id = an.author_id
    where an.created_at >= start_date and an.created_at <= end_date
    group by au.full_name
    order by count desc;
$$;

create or replace function approval_status_counts(start_date timestamptz, end_date timestamptz)
returns table(status text, count int)
language sql
stable
as $$
    select status, count(*)::int as count
    from news_approvals
    where created_at >= start_date and created_at <= end_date
    group by status;
$$;

-- Grant execute permissions
grant execute on function news_status_counts(timestamptz, timestamptz) to authenticated, anon;
grant execute on function news_by_category(timestamptz, timestamptz) to authenticated, anon;
grant execute on function news_by_month(timestamptz, timestamptz) to authenticated, anon;
grant execute on function author_news_counts(timestamptz, timestamptz) to authenticated, anon;
grant execute on function approval_status_counts(timestamptz, timestamptz) to authenticated, anon;
