import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MockAuthProvider } from './mocks/auth'
import { useAuth } from '../hooks/useAuth'
import { createSupabaseMock } from './mocks/supabase'

// Dummy component that uses the useAuth hook
const DummyComponent = () => {
  const { user } = useAuth()
  return <div>User email: {user?.email}</div>
}

describe('Test Infrastructure Setup', () => {
  test('math works', () => {
    expect(1 + 1).toBe(2)
  })

  test('MockAuthProvider renders children with user info', () => {
    render(
      <MockAuthProvider>
        <DummyComponent />
      </MockAuthProvider>
    )

    expect(screen.getByText('User email: test@example.com')).toBeInTheDocument()
  })

  test('MockAuthProvider renders empty state when user is null', () => {
    render(
      <MockAuthProvider user={null} session={null}>
        <DummyComponent />
      </MockAuthProvider>
    )

    expect(screen.getByText('User email:')).toBeInTheDocument()
  })

  test('createSupabaseMock returns chainable mocks', async () => {
    const { client, mockFrom, mockSelect, mockQueryResult } = createSupabaseMock()
    mockQueryResult(mockSelect, [{ id: 1, name: 'Argentina' }])

    const { data } = await client.from('teams').select('*')
    expect(mockFrom).toHaveBeenCalledWith('teams')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(data).toEqual([{ id: 1, name: 'Argentina' }])
  })
})
