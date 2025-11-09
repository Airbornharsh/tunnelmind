export const getTerminalToken = () => {
  const terminalToken = localStorage.getItem('tunnelmind_terminalToken')
  return terminalToken
}

export const setTerminalToken = (terminalToken: string) => {
  if (terminalToken) {
    localStorage.setItem('tunnelmind_terminalToken', terminalToken)
  }
}

export const clearTerminalToken = () => {
  localStorage.removeItem('tunnelmind_terminalToken')
}
