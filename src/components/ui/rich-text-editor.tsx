import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  className?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value = '', onChange, className }) => {
  const [tiptap, setTiptap] = useState<any>(null)

  useEffect(() => {
    Promise.all([import('@tiptap/react'), import('@tiptap/starter-kit')]).then(
      ([react, starter]) => {
        setTiptap({ ...react, StarterKit: starter.default })
      }
    )
  }, [])

  const editor = tiptap?.useEditor({
    extensions: [tiptap.StarterKit],
    content: value,
    onUpdate({ editor }: any) {
      onChange?.(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!tiptap || !editor) return null

  const EditorContent = tiptap.EditorContent

  return (
    <div
      className={cn(
        'min-h-[300px] w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none" />
    </div>
  )
}

export default RichTextEditor

