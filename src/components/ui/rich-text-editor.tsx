import React, { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { Textarea } from './textarea'

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
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (process.env.NODE_ENV === 'test') {
    return (
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={className}
        data-testid="rich-text-editor"
      />
    )
  }

  return (
    <div
      className={cn(
        'min-h-[300px] w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      <EditorContent editor={editor} id={id} />
    </div>
  )
}

export default RichTextEditor
