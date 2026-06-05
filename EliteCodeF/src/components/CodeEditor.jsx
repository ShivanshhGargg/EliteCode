import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'

export function CodeEditor({ value, onChange, language = 'java', height = '100%', readOnly = false }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleChange = (val) => {
    if (onChange) onChange(val || '')
  }

  if (!mounted) {
    return (
      <div className="w-full rounded-[28px] border border-white/5 bg-[#060912] flex items-center justify-center" style={{ height }}>
        <div className="w-5 h-5 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-white/5 overflow-hidden bg-[#060912] shadow-[0_18px_70px_rgba(0,0,0,0.24)]" style={{ height }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          padding: { top: 20, bottom: 20 },
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
      />
    </div>
  )
}

export default CodeEditor
