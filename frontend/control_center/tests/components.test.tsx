import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import ErrorBoundary from '../components/ErrorBoundary'
import { Input, TextArea, Select, Button, Checkbox, FormError } from '../components/FormInputs'
import { Skeleton, CardSkeleton, DashboardSkeleton, StatCardSkeleton } from '../components/Skeleton'

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

describe('ErrorBoundary Component', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  test('renders error UI when error occurs', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })

  test('has reload button that calls window.location.reload', () => {
    const reloadMock = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Reload Page'))
    expect(reloadMock).toHaveBeenCalled()
  })
})

describe('FormInputs Components', () => {
  test('Input renders with label', () => {
    render(
      <TestWrapper>
        <Input label="Test Label" />
      </TestWrapper>
    )
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  test('Input shows error message', () => {
    render(
      <TestWrapper>
        <Input error="This field is required" />
      </TestWrapper>
    )
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  test('Input shows success message', () => {
    render(
      <TestWrapper>
        <Input success="Looks good!" />
      </TestWrapper>
    )
    expect(screen.getByText('Looks good!')).toBeInTheDocument()
  })

  test('Input shows hint text', () => {
    render(
      <TestWrapper>
        <Input hint="Enter your full name" />
      </TestWrapper>
    )
    expect(screen.getByText('Enter your full name')).toBeInTheDocument()
  })

  test('TextArea renders with label', () => {
    render(
      <TestWrapper>
        <TextArea label="Description" />
      </TestWrapper>
    )
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  test('TextArea shows error message', () => {
    render(
      <TestWrapper>
        <TextArea error="Description is too short" />
      </TestWrapper>
    )
    expect(screen.getByText('Description is too short')).toBeInTheDocument()
  })

  test('Select renders with options', () => {
    render(
      <TestWrapper>
        <Select
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </TestWrapper>
    )
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  test('Select shows placeholder', () => {
    render(
      <TestWrapper>
        <Select
          label="Status"
          placeholder="Select an option"
          options={[
            { value: 'active', label: 'Active' },
          ]}
        />
      </TestWrapper>
    )
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  test('Button renders children', () => {
    render(
      <TestWrapper>
        <Button>Click Me</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  test('Button shows loading state', () => {
    render(
      <TestWrapper>
        <Button loading>Loading</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('Button is disabled when loading', () => {
    render(
      <TestWrapper>
        <Button loading>Click Me</Button>
      </TestWrapper>
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('Button variants render correctly', () => {
    const { container } = render(
      <TestWrapper>
        <Button variant="primary">Primary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
      </TestWrapper>
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(3)
  })

  test('Checkbox renders with label', () => {
    render(
      <TestWrapper>
        <Checkbox label="I agree to terms" />
      </TestWrapper>
    )
    expect(screen.getByText('I agree to terms')).toBeInTheDocument()
  })

  test('Checkbox can be checked', () => {
    render(
      <TestWrapper>
        <Checkbox label="Remember me" />
      </TestWrapper>
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  test('FormError renders error message', () => {
    render(
      <TestWrapper>
        <FormError message="An error occurred" />
      </TestWrapper>
    )
    expect(screen.getByText('An error occurred')).toBeInTheDocument()
  })
})

describe('Skeleton Components', () => {
  test('Skeleton renders', () => {
    const { container } = render(
      <TestWrapper>
        <Skeleton className="h-4 w-20" />
      </TestWrapper>
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  test('CardSkeleton renders', () => {
    const { container } = render(
      <TestWrapper>
        <CardSkeleton />
      </TestWrapper>
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  test('DashboardSkeleton renders', () => {
    const { container } = render(
      <TestWrapper>
        <DashboardSkeleton />
      </TestWrapper>
    )
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  test('StatCardSkeleton renders', () => {
    const { container } = render(
      <TestWrapper>
        <StatCardSkeleton />
      </TestWrapper>
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('API Error Handling', () => {
  test('ApiService handles 404 error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ detail: 'Resource not found' }),
      })
    ) as jest.Mock

    const { ApiService } = await import('../utils/api')
    
    await expect(ApiService.getIncidents()).rejects.toThrow('Resource not found')
  })

  test('ApiService handles 500 error with retry', async () => {
    let callCount = 0
    global.fetch = jest.fn(() => {
      callCount++
      if (callCount < 2) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    }) as jest.Mock

    const { ApiService } = await import('../utils/api')
    const result = await ApiService.getIncidents()
    expect(result).toEqual([])
    expect(callCount).toBe(2)
  })

  test('ApiService handles network error', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network request failed'))
    ) as jest.Mock

    const { ApiService } = await import('../utils/api')
    
    await expect(ApiService.getIncidents()).rejects.toThrow('Network request failed')
  })
})

describe('Input Validation', () => {
  test('Input accepts typed value', () => {
    render(
      <TestWrapper>
        <Input value="test value" />
      </TestWrapper>
    )
    const input = screen.getByDisplayValue('test value')
    expect(input).toBeInTheDocument()
  })

  test('Input accepts placeholder', () => {
    render(
      <TestWrapper>
        <Input placeholder="Enter text..." />
      </TestWrapper>
    )
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  test('Input can be disabled', () => {
    render(
      <TestWrapper>
        <Input disabled />
      </TestWrapper>
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  test('Select can change value', () => {
    render(
      <TestWrapper>
        <Select
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
        />
      </TestWrapper>
    )
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'b' } })
    expect(select).toHaveValue('b')
  })
})
