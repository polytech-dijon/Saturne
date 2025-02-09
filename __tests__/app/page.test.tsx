import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));


describe('Page', () => {
  it('renders a heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })

  it('renders an image', () => {
    render(<Home />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('renders the correct heading text', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Hello, World!')
  })

  it('renders the image with correct attributes', () => {
    render(<Home />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', expect.stringMatching(/\/_next\/image\?url=%2Fsaturne.png/))
    expect(img).toHaveAttribute('alt', 'Saturne logo')
  })
})
