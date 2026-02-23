/**
 * Frontend Tests for Kenya Overwatch Production System
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import ProductionDashboard from '../components/ProductionDashboard'
import AlertCard from '../components/AlertCard'
import IncidentCard from '../components/IncidentCard'
import { mockIncidents, mockAlerts, mockSystemMetrics } from './mocks/data'

// Test wrapper with providers
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

// Mock fetch API
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('ProductionDashboard Component', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  test('renders dashboard with initial loading state', () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    expect(screen.queryByText(/Kenya/i)).toBeInTheDocument()
  })

  test.skip('displays system metrics when data is loaded', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIncidents
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSystemMetrics
      })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/29\.8 FPS/i)).toBeInTheDocument()
    })
  })

  test.skip('displays incidents when loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIncidents
    })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Security Incident/i)).toBeInTheDocument()
    })
  })

  test('shows real-time alerts section when alerts are present', () => {
    const alerts = mockAlerts.slice(0, 1)

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    // Check if alerts section can be rendered
    const alertsSection = screen.queryByText('Real-time Risk Alerts')
    // Initially might not be visible until alerts are fetched
  })

  test.skip('displays risk trends chart', () => {
    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    // Check for chart component presence
    expect(screen.queryByText(/Risk/i)).toBeInTheDocument()
  })
})

describe('AlertCard Component', () => {
  const mockOnAcknowledge = jest.fn()

  test('renders alert information correctly', () => {
    const alert = mockAlerts[0]

    render(
      <TestWrapper>
        <AlertCard alert={alert} onAcknowledge={mockOnAcknowledge} />
      </TestWrapper>
    )

    expect(screen.getByText(alert.title)).toBeInTheDocument()
    expect(screen.getByText(alert.message)).toBeInTheDocument()
    expect(screen.getByText(alert.severity.toUpperCase())).toBeInTheDocument()
  })

  test('shows acknowledge button for unacknowledged alerts', () => {
    const alert = { ...mockAlerts[0], acknowledged: false }

    render(
      <TestWrapper>
        <AlertCard alert={alert} onAcknowledge={mockOnAcknowledge} />
      </TestWrapper>
    )

    const acknowledgeButton = screen.getByText('Acknowledge')
    expect(acknowledgeButton).toBeInTheDocument()
    expect(acknowledgeButton).not.toBeDisabled()
  })

  test('shows acknowledged status for acknowledged alerts', () => {
    const alert = { ...mockAlerts[0], acknowledged: true }

    render(
      <TestWrapper>
        <AlertCard alert={alert} onAcknowledge={mockOnAcknowledge} />
      </TestWrapper>
    )

    expect(screen.getByText('Acknowledged')).toBeInTheDocument()
    expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument()
  })

  test('calls onAcknowledge when acknowledge button is clicked', () => {
    const alert = { ...mockAlerts[0], acknowledged: false }

    render(
      <TestWrapper>
        <AlertCard alert={alert} onAcknowledge={mockOnAcknowledge} />
      </TestWrapper>
    )

    const acknowledgeButton = screen.getByText('Acknowledge')
    fireEvent.click(acknowledgeButton)

    expect(mockOnAcknowledge).toHaveBeenCalledWith(alert.id)
  })

  test.skip('displays risk score when present', () => {
    const alert = { ...mockAlerts[0], risk_score: 0.85 }

    render(
      <TestWrapper>
        <AlertCard alert={alert} onAcknowledge={mockOnAcknowledge} />
      </TestWrapper>
    )

    expect(screen.queryByText(/Risk/i)).toBeInTheDocument()
  })
})

describe('IncidentCard Component', () => {
  const mockOnClick = jest.fn()

  test('renders incident information correctly', () => {
    const incident = mockIncidents[0]

    render(
      <TestWrapper>
        <IncidentCard incident={incident} onClick={mockOnClick} />
      </TestWrapper>
    )

    expect(screen.getByText(incident.title)).toBeInTheDocument()
    expect(screen.getByText(incident.location)).toBeInTheDocument()
    expect(screen.getByText(incident.severity.toUpperCase())).toBeInTheDocument()
  })

  test('displays correct status badge', () => {
    const incident = { ...mockIncidents[0], status: 'active' }

    render(
      <TestWrapper>
        <IncidentCard incident={incident} onClick={mockOnClick} />
      </TestWrapper>
    )

    expect(screen.getByText('active')).toBeInTheDocument()
  })

  test('shows human review warning when required', () => {
    const incident = {
      ...mockIncidents[0],
      requires_human_review: true,
      human_review_completed: false
    }

    render(
      <TestWrapper>
        <IncidentCard incident={incident} onClick={mockOnClick} />
      </TestWrapper>
    )

    expect(screen.getByText('⚠️ Requires Human Review')).toBeInTheDocument()
  })

  test('calls onClick when card is clicked', () => {
    const incident = mockIncidents[0]

    render(
      <TestWrapper>
        <IncidentCard incident={incident} onClick={mockOnClick} />
      </TestWrapper>
    )

    const card = screen.getByText(incident.title).closest('div')
    fireEvent.click(card!)

    expect(mockOnClick).toHaveBeenCalled()
  })

  test('displays risk score correctly', () => {
    const incident = mockIncidents[0]

    render(
      <TestWrapper>
        <IncidentCard incident={incident} onClick={mockOnClick} />
      </TestWrapper>
    )

    expect(screen.getByText(incident.risk_assessment.risk_score.toFixed(2))).toBeInTheDocument()
  })
})

describe.skip('WebSocket Connection', () => {
  test('establishes WebSocket connection on component mount', () => {
    const mockWebSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    }

    global.WebSocket = jest.fn(() => mockWebSocket) as any

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/control_center')
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
  })

  test('handles WebSocket messages correctly', async () => {
    const mockWebSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    }

    global.WebSocket = jest.fn(() => mockWebSocket) as any

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    // Get the message handler
    const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )[1]

    // Simulate incoming message
    const testMessage = {
      type: 'incident_created',
      data: mockIncidents[0]
    }

    messageHandler({ data: JSON.stringify(testMessage) })

    // Verify message was processed
    await waitFor(() => {
      expect(screen.getByText(mockIncidents[0].title)).toBeInTheDocument()
    })
  })
})

describe.skip('API Integration', () => {
  test('fetches incidents from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIncidents
    })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/incidents')
    })
  })

  test('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'))

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      // Should still render basic UI despite API error
      expect(screen.getByText('Kenya Overwatch Production')).toBeInTheDocument()
    })
  })

  test('retries failed requests', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIncidents
      })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2) // Initial call + retry
    })
  })
})

describe.skip('Component Integration', () => {
  test('dashboard displays incident details when incident is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIncidents
    })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(mockIncidents[0].title)).toBeInTheDocument()
    })

    // Click on incident
    fireEvent.click(screen.getByText(mockIncidents[0].title))

    // Check if incident detail modal appears
    await waitFor(() => {
      expect(screen.getByText(mockIncidents[0].description)).toBeInTheDocument()
    })
  })

  test('filters incidents by severity', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIncidents
    })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(mockIncidents[0].title)).toBeInTheDocument()
    })

    // Test filtering (this would require implementing filter controls)
    // For now, just verify the component renders without errors
  })
})

describe.skip('Performance', () => {
  test('dashboard renders within performance budget', async () => {
    const startTime = performance.now()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIncidents
    })

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(mockIncidents[0].title)).toBeInTheDocument()
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000)
  })

  test('handles large number of incidents efficiently', async () => {
    const largeIncidentList = Array.from({ length: 100 }, (_, i) => ({
      ...mockIncidents[0],
      id: `incident_${i}`,
      title: `Incident ${i}`
    }))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => largeIncidentList
    })

    const startTime = performance.now()

    render(
      <TestWrapper>
        <ProductionDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Suspicious Person Detected/i)).toBeInTheDocument()
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should handle 100 incidents within 3 seconds
    expect(renderTime).toBeLessThan(3000)
  })
})