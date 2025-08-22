import React, { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  className?: string
  id?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value = '', onChange, className, id }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        id: id,
        class: 'prose prose-sm max-w-none focus:outline-none',
        'data-testid': 'rich-text-editor', // Add a test ID
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  return (
    <div
      className={cn(
        'min-h-[300px] w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
