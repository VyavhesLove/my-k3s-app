import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfirmTMCModal } from '../modals'
import { useItemStore } from '@/store/useItemStore'
import api from '@/api/axios'
import { toast } from 'sonner'

vi.mock('@/api/axios', () => ({
  default: {
    post: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

const mockLockItem = vi.fn()
const mockUnlockItem = vi.fn()
const mockRefreshItems = vi.fn()
const mockCloseConfirmTMCModal = vi.fn()
const mockSetSelectedItem = vi.fn()

let mockStoreState

vi.mock('@/store/useItemStore', () => ({
  useItemStore: vi.fn(() => mockStoreState)
}))

const createStoreState = (overrides = {}) => ({
  selectedItem: { id: 6, name: 'Test Item', status: 'created' },
  isConfirmTMCModalOpen: true,
  closeConfirmTMCModal: mockCloseConfirmTMCModal,
  lockItem: mockLockItem,
  unlockItem: mockUnlockItem,
  refreshItems: mockRefreshItems,
  setSelectedItem: mockSetSelectedItem,
  ...overrides
})

const renderModal = () => render(<ConfirmTMCModal isDarkMode={false} />)

const getSubmitButtonByName = (name) =>
  screen
    .getAllByRole('button', { name })
    .find((button) => button.getAttribute('type') !== 'button')

describe('ConfirmTMCModal - Подтверждение ТМЦ', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockLockItem.mockResolvedValue({})
    mockUnlockItem.mockResolvedValue({})
    mockRefreshItems.mockResolvedValue({})

    mockStoreState = createStoreState()
  })

  it('рендерит заголовок и данные ТМЦ', async () => {
    renderModal()

    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('вызывает lockItem при открытии модалки', async () => {
    renderModal()

    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalledWith(6)
    })
  })

  it('отправляет accept по умолчанию при сабмите', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'ok' } })

    renderModal()

    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalledWith(6)
    })

    const submitButton = getSubmitButtonByName('Принять')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/items/6/confirm-tmc/', { action: 'accept' })
    })

    expect(mockRefreshItems).toHaveBeenCalled()
    expect(mockSetSelectedItem).toHaveBeenCalledWith(null)
    expect(mockUnlockItem).toHaveBeenCalledWith(6)
    expect(mockCloseConfirmTMCModal).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })

  it('отправляет reject после выбора действия Отклонить', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'ok' } })

    renderModal()

    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalledWith(6)
    })

    const rejectActionButton = screen
      .getAllByRole('button', { name: 'Отклонить' })
      .find((button) => button.getAttribute('type') === 'button')

    fireEvent.click(rejectActionButton)

    const submitButton = getSubmitButtonByName('Отклонить')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/items/6/confirm-tmc/', { action: 'reject' })
    })
  })

  it('показывает ошибку блокировки 423 и не отправляет POST', async () => {
    mockLockItem.mockRejectedValueOnce({
      response: {
        status: 423,
        data: {
          locked_by: 'Другой пользователь'
        }
      }
    })

    renderModal()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('🔒 Другой пользователь', {
        description: 'Этот ТМЦ уже редактируется другим пользователем'
      })
    })

    const submitButton = getSubmitButtonByName('Принять')
    expect(submitButton).toBeDisabled()
    fireEvent.click(submitButton)

    expect(api.post).not.toHaveBeenCalled()
  })

  it('показывает ошибку из API при неудачном подтверждении', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: { detail: 'Ошибка валидации' }
      }
    })

    renderModal()

    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalledWith(6)
    })

    const submitButton = getSubmitButtonByName('Принять')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка валидации')
    })
  })

  it('не рендерится, если модалка закрыта', () => {
    mockStoreState = createStoreState({
      isConfirmTMCModalOpen: false
    })

    renderModal()

    expect(screen.queryByText('Подтверждение ТМЦ')).not.toBeInTheDocument()
  })

  it('не рендерится, если selectedItem отсутствует', () => {
    mockStoreState = createStoreState({
      selectedItem: null
    })

    renderModal()

    expect(screen.queryByText('Подтверждение ТМЦ')).not.toBeInTheDocument()
  })
})
