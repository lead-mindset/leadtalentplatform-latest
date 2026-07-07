import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.hoisted(() => vi.fn())
const createServiceClientMock = vi.hoisted(() => vi.fn())
const getAdminDashboardStatsServiceMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/supabase/server-service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('@/lib/services/admin.service', () => ({
  AdminService: {
    getAdminDashboardStats: getAdminDashboardStatsServiceMock,
  },
}))

import { getAdminDashboardStats } from './get-data'

describe('admin get-data actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue({})
    createServiceClientMock.mockReturnValue({})
    getAdminDashboardStatsServiceMock.mockResolvedValue({ total_users: 1 })
  })

  it('uses the service-role client for admin dashboard stats', async () => {
    await getAdminDashboardStats()

    expect(createServiceClientMock).toHaveBeenCalledTimes(1)
    expect(createClientMock).not.toHaveBeenCalled()
    expect(getAdminDashboardStatsServiceMock).toHaveBeenCalledWith({})
  })
})
