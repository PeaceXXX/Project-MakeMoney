import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /trading platform/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    render(<Home />)
    expect(screen.getByText(/welcome to the trading and finance platform/i)).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    render(<Home />)
    expect(screen.getByText(/portfolio/i)).toBeInTheDocument()
    expect(screen.getByText(/market data/i)).toBeInTheDocument()
    expect(screen.getByText(/trading/i)).toBeInTheDocument()
  })
})
