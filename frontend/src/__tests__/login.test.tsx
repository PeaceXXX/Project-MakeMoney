import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'
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

describe('Login Page', () => {
  it('renders login form', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid email', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const signInButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(signInButton)

    expect(screen.getByText(/email is invalid/i)).toBeInTheDocument()
  })

  it('shows validation error for missing password', () => {
    render(<LoginPage />)

    const signInButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.click(signInButton)

    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('shows validation error for missing email', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const signInButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.click(signInButton)

    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })

  it('toggles password visibility', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button')

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle button
    fireEvent.click(toggleButton)

    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('toggles remember me checkbox', () => {
    render(<LoginPage />)

    const checkbox = screen.getByLabelText(/remember me/i)

    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('shows link to registration page', () => {
    render(<LoginPage />)

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
  })

  it('shows forgot password link', () => {
    render(<LoginPage />)

    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument()
  })
})
