import { vi } from 'vitest'

export interface MockResponse {
  data: any
  error: any
}

export const createSupabaseMock = () => {
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockUpsert = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockOrder = vi.fn()
  const mockRpc = vi.fn()

  const queryBuilder = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  }

  // Setup chains
  mockSelect.mockReturnValue(queryBuilder)
  mockInsert.mockReturnValue(queryBuilder)
  mockUpdate.mockReturnValue(queryBuilder)
  mockDelete.mockReturnValue(queryBuilder)
  mockUpsert.mockReturnValue(queryBuilder)
  mockEq.mockReturnValue(queryBuilder)
  mockSingle.mockReturnValue(queryBuilder)
  mockOrder.mockReturnValue(queryBuilder)

  const mockFrom = vi.fn().mockReturnValue(queryBuilder)
  const mockChannel = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })

  const client = {
    from: mockFrom,
    rpc: mockRpc,
    channel: mockChannel,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }

  // Helpers to mock successful/failed responses easily
  const mockQueryResult = (methodMock: any, data: any, error: any = null) => {
    methodMock.mockResolvedValue({ data, error })
  }

  const mockQueryChainResult = (data: any, error: any = null) => {
    // When calling final methods like single or matching simple resolves, return this
    mockSelect.mockResolvedValue({ data, error })
    mockInsert.mockResolvedValue({ data, error })
    mockUpdate.mockResolvedValue({ data, error })
    mockDelete.mockResolvedValue({ data, error })
    mockUpsert.mockResolvedValue({ data, error })
    mockSingle.mockResolvedValue({ data, error })
    mockEq.mockResolvedValue({ data, error })
    mockOrder.mockResolvedValue({ data, error })
  }

  return {
    client,
    mockFrom,
    mockRpc,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockUpsert,
    mockEq,
    mockSingle,
    mockOrder,
    mockChannel,
    mockQueryResult,
    mockQueryChainResult,
  }
}
