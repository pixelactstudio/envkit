export async function copyText(text: string) {
  if (window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back for denied clipboard permissions.
    }
  }

  const field = document.createElement("textarea")
  field.value = text
  field.setAttribute("readonly", "")
  field.style.position = "fixed"
  field.style.opacity = "0"
  document.body.append(field)
  field.select()
  const copied = document.execCommand("copy")
  field.remove()

  if (!copied) throw new Error("Clipboard access is unavailable.")
}
