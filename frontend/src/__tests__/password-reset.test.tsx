import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPasswordPage from '@/app/forgot-password/page'
import ResetPasswordPage from '@/app/reset-password/page'
import api from '@/lib/api'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/api', () => ({
  default: {
    post: jest.fn(),
  },
}))

describe('Forgot Password Page', () => {
  it('renders forgot password form', () => {
    render(<ForgotPasswordPage />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument()
  })

  it('validates email format', () => {
    render(<ForgotPasswordPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
  })

  it('submits reset request on valid email', async () => {
    const mockPost = api.post as jest.MockedFunction
    mockPost.mockResolvedValue({ data: { message: 'Reset link sent' } })

    render(<ForgotPasswordPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/password-reset-request', {
        email: 'user@example.com',
      })
    })

    expect(screen.getByText(/reset link sent/i)).toBeInTheDocument()
  })
})

describe('Reset Password Page', () => {
  it('shows error for invalid token', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByText(/invalid or expired reset link/i)).toBeInTheDocument()
  })

  it('renders reset password form with valid token', () => {
    render(
      <ResetPasswordPage />,
      { wrapper: ({ children }) => (
        // Mock URLSearchParams to provide a token
        <div>
          {React.cloneElement(children as any, {
            props: { ...((children as any).props), children: children } as any,
          })}
        </div>
      ),
    })

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it('validates password length', () => {
    render(
      <ResetPasswordPage />,
      { wrapper: ({ children }) => (
        <div>
          {React.cloneElement(children as any, {
            props: { ...((children as any).props), children: children } as any,
          })}
        </div>
      ),
    })

    const passwordInput = screen.getByLabelText(/new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('validates password confirmation', () => {
    render(
      <ResetPasswordPage />,
      { wrapper: ({ children }) => (
        <div>
          {React.cloneElement(children as any, {
            props: { ...((children as any).props), children: children } as any,
          })}
        </div>
      ),
    })

    const newPassword = screen.getByLabelText(/new password/i)
    const confirmPassword = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    fireEvent.change(newPassword, { target: { value: 'password123' } })
    fireEvent.change(confirmPassword, { target: { value: 'different' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })
})
