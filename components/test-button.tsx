'use client'
export default function TestCrashButton() {
  return (
    <button onClick={() => { throw new Error('test debug UI') }}>
      test crash
    </button>
  )
}