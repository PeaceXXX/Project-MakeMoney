import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '@/app/register/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/api', () => ({
  default: {
    post: jest.fn(),
  },
}))

describe('Register Page', () => {
  it('renders registration form', () => {
    render(<RegisterPage />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid email', () => {
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const createButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(createButton)

    expect(screen.getByText(/email is invalid/i)).toBeInTheDocument()
  })

  it('shows validation error for short password', () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const createButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.click(createButton)

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows validation error for mismatched passwords', () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const createButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    fireEvent.click(createButton)

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('shows link to login page', () => {
    render(<RegisterPage />)

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })
})
