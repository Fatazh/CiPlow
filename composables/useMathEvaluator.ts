// composables/useMathEvaluator.ts
// Safe arithmetic expression evaluator for transaction amount inputs

/**
 * Safely parses and evaluates basic arithmetic expressions (+, -, *, /)
 * without using dangerous eval() or new Function().
 */
export function evaluateMathExpression(input: string): { result: number | null; isValid: boolean; isExpression: boolean } {
  if (!input || typeof input !== 'string') {
    return { result: null, isValid: false, isExpression: false }
  }

  // Remove spaces, currency prefixes, thousand separators
  let sanitized = input
    .replace(/^rp\s*/i, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')

  // Check if string contains arithmetic operators
  const hasOperator = /[+\-*/]/.test(sanitized)
  if (!hasOperator) {
    const num = Number(sanitized.replace(/\./g, ''))
    return {
      result: isNaN(num) ? null : num,
      isValid: !isNaN(num) && num >= 0,
      isExpression: false,
    }
  }

  // Ensure string only contains allowed math characters
  if (!/^[\d.+\-*/()]+$/.test(sanitized)) {
    return { result: null, isValid: false, isExpression: true }
  }

  try {
    const tokens: (number | string)[] = []
    let currentNumber = ''

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i]
      if (char && /[\d.]/.test(char)) {
        currentNumber += char
      } else if (char && /[+\-*/()]/.test(char)) {
        if (currentNumber) {
          const parsed = parseFloat(currentNumber)
          if (!isNaN(parsed)) tokens.push(parsed)
          currentNumber = ''
        }
        tokens.push(char)
      }
    }
    if (currentNumber) {
      const parsed = parseFloat(currentNumber)
      if (!isNaN(parsed)) tokens.push(parsed)
    }

    if (tokens.length === 0) {
      return { result: null, isValid: false, isExpression: true }
    }

    // Shunting-yard algorithm for safe calculation
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
    const outputQueue: (number | string)[] = []
    const operatorStack: string[] = []

    for (const token of tokens) {
      if (typeof token === 'number') {
        outputQueue.push(token)
      } else if (typeof token === 'string') {
        if (token in precedence) {
          const tokenPrec = precedence[token] ?? 0
          while (operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1]
            if (top && top in precedence && (precedence[top] ?? 0) >= tokenPrec) {
              const popped = operatorStack.pop()
              if (popped) outputQueue.push(popped)
            } else {
              break
            }
          }
          operatorStack.push(token)
        } else if (token === '(') {
          operatorStack.push(token)
        } else if (token === ')') {
          while (operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1]
            if (top === '(') {
              operatorStack.pop()
              break
            }
            const popped = operatorStack.pop()
            if (popped) outputQueue.push(popped)
          }
        }
      }
    }

    while (operatorStack.length > 0) {
      const popped = operatorStack.pop()
      if (popped && popped !== '(' && popped !== ')') {
        outputQueue.push(popped)
      }
    }

    // Evaluate Reverse Polish Notation (RPN)
    const evalStack: number[] = []
    for (const token of outputQueue) {
      if (typeof token === 'number') {
        evalStack.push(token)
      } else if (typeof token === 'string' && token in precedence) {
        const b = evalStack.pop()
        const a = evalStack.pop()
        if (a === undefined || b === undefined) return { result: null, isValid: false, isExpression: true }

        let res = 0
        switch (token) {
          case '+': res = a + b; break
          case '-': res = a - b; break
          case '*': res = a * b; break
          case '/': res = b !== 0 ? a / b : 0; break
        }
        evalStack.push(res)
      }
    }

    if (evalStack.length !== 1 || evalStack[0] === undefined || isNaN(evalStack[0])) {
      return { result: null, isValid: false, isExpression: true }
    }

    const val = evalStack[0]
    const finalResult = Math.round(val * 100) / 100
    return {
      result: finalResult >= 0 ? finalResult : null,
      isValid: finalResult >= 0,
      isExpression: true,
    }
  } catch {
    return { result: null, isValid: false, isExpression: true }
  }
}
