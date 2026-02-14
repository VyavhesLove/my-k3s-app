import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ConfirmTMCModal from '../modals/ConfirmTMCModal'
import { useItemStore } from '@/store/useItemStore'
import api from '@/api/axios'
import { toast } from 'sonner'

// Мокаем axios
vi.mock('@/api/axios', () => ({
  default: {
    post: vi.fn()
  }
}))

// Мокаем useItemStore - возвращаем функцию которая принимает коллбэк
const mockLockItem = vi.fn().mockResolvedValue({})
const mockUnlockItem = vi.fn().mockResolvedValue({})
const mockRefreshItems = vi.fn().mockResolvedValue({})
const mockCloseConfirmTMCModal = vi.fn()
const mockSetSelectedItem = vi.fn()

// Создаём мок для useItemStore
const createMockUseItemStore = () => ({
  selectedItem: { id: 6, name: 'Test Item', status: 'created' },
  isConfirmTMCModalOpen: true,
  closeConfirmTMCModal: mockCloseConfirmTMCModal,
  lockItem: mockLockItem,
  unlockItem: mockUnlockItem,
  refreshItems: mockRefreshItems,
  setSelectedItem: mockSetSelectedItem
})

vi.mock('@/store/useItemStore', () => ({
  useItemStore: vi.fn(() => createMockUseItemStore())
}))

// Мокаем sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('ConfirmTMCModal - Подтверждение ТМЦ', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('должен отображать модальное окно с заголовком "Подтверждение ТМЦ"', async () => {
    render(<ConfirmTMCModal isDarkMode={false} />)
    
    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
  })

  it('должен отображать название и ID ТМЦ', async () => {
    render(<ConfirmTMCModal isDarkMode={false} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument()
    })
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('должен иметь кнопки "Принять" и "Отклонить"', async () => {
    render(<ConfirmTMCModal isDarkMode={false} />)
    
    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Принять')).toBeInTheDocument()
    expect(screen.getByText('Отклонить')).toBeInTheDocument()
  })

  it('должен вызывать lockItem при открытии модального окна', async () => {
    render(<ConfirmTMCModal isDarkMode={false} />)
    
    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
    
    // Проверяем, что lockItem был вызван с правильным ID
    expect(mockLockItem).toHaveBeenCalledWith(6)
  })

  it('должен отправить POST запрос при нажатии кнопки принятия', async () => {
    // Настраиваем мок для успешного ответа
    api.post.mockResolvedValueOnce({ 
      data: { message: 'ТМЦ подтверждено' } 
    })

    render(<ConfirmTMCModal isDarkMode={false} />)

    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
    
    // Ждём, пока lockItem выполнится и isLocked станет true
    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalled()
    })

    // Теперь кликаем на кнопку принятия
    const buttons = screen.getAllByRole('button')
    const acceptButton = buttons.find(b => b.textContent === 'Принять')
    
    await act(async () => {
      fireEvent.click(acceptButton)
    })

    // Проверяем, что API был вызван
    expect(api.post).toHaveBeenCalled()
  })

  it('должен отправить правильные данные при accept', async () => {
    api.post.mockResolvedValueOnce({ 
      data: { message: 'ТМЦ подтверждено' } 
    })

    render(<ConfirmTMCModal isDarkMode={false} />)

    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalled()
    })

    const buttons = screen.getAllByRole('button')
    const acceptButton = buttons.find(b => b.textContent === 'Принять')
    
    await act(async () => {
      fireEvent.click(acceptButton)
    })

    expect(api.post).toHaveBeenCalledWith(
      '/items/6/confirm-tmc/',
      { action: 'accept' }
    )
  })

  it('должен отправить правильные данные при reject', async () => {
    api.post.mockResolvedValueOnce({ 
      data: { message: 'ТМЦ отклонено' } 
    })

    render(<ConfirmTMCModal isDarkMode={false} />)

    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalled()
    })

    // Сначала выбираем опцию "Отклонить"
    const buttons = screen.getAllByRole('button')
    const rejectOptionButton = buttons.find(b => b.textContent === 'Отклонить')
    
    await act(async () => {
      fireEvent.click(rejectOptionButton)
    })

    // Теперь нажимаем submit кнопку
    const allButtons = screen.getAllByRole('button')
    const rejectSubmitButton = allButtons.find(b => b.textContent === 'Отклонить')
    
    await act(async () => {
      fireEvent.click(rejectSubmitButton)
    })

    expect(api.post).toHaveBeenCalledWith(
      '/items/6/confirm-tmc/',
      { action: 'reject' }
    )
  })

  it('должен показать ошибку при неудачном запросе', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: { detail: 'Ошибка валидации' },
        status: 400
      }
    })

    render(<ConfirmTMCModal isDarkMode={false} />)

    await waitFor(() => {
      expect(screen.getByText('Подтверждение ТМЦ')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(mockLockItem).toHaveBeenCalled()
    })

    const buttons = screen.getAllByRole('button')
    const acceptButton = buttons.find(b => b.textContent === 'Принять')
    
    await act(async () => {
      fireEvent.click(acceptButton)
    })

    expect(toast.error).toHaveBeenCalled()
  })
})

