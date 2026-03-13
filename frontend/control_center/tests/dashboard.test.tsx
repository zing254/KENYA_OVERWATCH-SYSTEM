/**
 * Frontend Tests for Kenya Overwatch Production System
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import RoadSafetyDashboard from '../components/RoadSafetyDashboard'

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('RoadSafetyDashboard Component', () => {
  const originalError = console.error
  const originalWarn = console.warn

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    console.warn = jest.fn()
  })

  afterEach(() => {
    console.error = originalError
    console.warn = originalWarn
  })

  test('renders without crashing', () => {
    const { container } = render(
      <TestWrapper>
        <RoadSafetyDashboard />
      </TestWrapper>
    )
    expect(container).toBeInTheDocument()
  })

  test('renders with correct structure', () => {
    const { container } = render(
      <TestWrapper>
        <RoadSafetyDashboard />
      </TestWrapper>
    )
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  test('renders header element', () => {
    const { container } = render(
      <TestWrapper>
        <RoadSafetyDashboard />
      </TestWrapper>
    )
    expect(container.querySelector('header')).toBeInTheDocument()
  })
})