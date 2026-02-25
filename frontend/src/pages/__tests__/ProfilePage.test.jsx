import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfilePage } from '../ProfilePage'
import { useProfile } from '@/hooks/useProfile'
import { BrowserRouter } from 'react-router-dom'

// Мок useProfile хука
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn()
}))

// Мок sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Обертка для рендера с роутером
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

const createMockUseProfile = (overrides = {}) => ({
  user: {
    id: 1,
    username: 'testuser',
    first_name: 'Тест',
    last_name: 'Юзер',
    email: 'test@example.com',
    role: 'admin'
  },
  history: [],
  sessions: [],
  loading: false,
  // Формы
  profileForm: {
    first_name: 'Тест',
    last_name: 'Юзер',
    email: 'test@example.com'
  },
  setProfileForm: vi.fn(),
  passwordForm: {
    current_password: '',
    new_password: '',
    confirm_password: ''
  },
  setPasswordForm: vi.fn(),
  // Функции
  handleProfileSubmit: vi.fn().mockResolvedValue(true),
  handlePasswordSubmit: vi.fn().mockResolvedValue(true),
  handleTerminateSession: vi.fn(),
  fetchUserData: vi.fn(),
  ...overrides
})

describe('ProfilePage - Редактирование профиля', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProfile.mockReturnValue(createMockUseProfile())
  })

  it('рендерит страницу профиля с данными пользователя', async () => {
    renderWithRouter(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Профиль пользователя')).toBeInTheDocument()
    })
    
    // username отображается
    expect(screen.getAllByText('testuser').length).toBeGreaterThan(0)
  })

  it('показывает кнопку "Редактировать профиль" в режиме просмотра', async () => {
    renderWithRouter(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Редактировать профиль')).toBeInTheDocument()
    })
  })

  it('переходит в режим редактирования при клике на "Редактировать профиль"', async () => {
    renderWithRouter(<ProfilePage />)
    
    await waitFor(() => {
      const editButton = screen.getByText('Редактировать профиль')
      fireEvent.click(editButton)
    })
    
    // После клика должна появиться форма с полями ввода
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ваше имя')).toBeInTheDocument()
    })
  })

  it('кнопка "Отмена" закрывает режим редактирования без сохранения', async () => {
    const mockHandleProfileSubmit = vi.fn().mockResolvedValue(true)
    
    useProfile.mockReturnValue(createMockUseProfile({
      handleProfileSubmit: mockHandleProfileSubmit
    }))
    
    renderWithRouter(<ProfilePage />)
    
    // Переходим в режим редактирования
    await waitFor(() => {
      const editButton = screen.getByText('Редактировать профиль')
      fireEvent.click(editButton)
    })
    
    // Проверяем, что форма редактирования отображается
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ваше имя')).toBeInTheDocument()
    })
    
    // Нажимаем кнопку "Отмена"
    const cancelButton = screen.getByText('Отмена')
    fireEvent.click(cancelButton)
    
    // Проверяем, что мы вернулись в режим просмотра
    await waitFor(() => {
      expect(screen.getByText('Редактировать профиль')).toBeInTheDocument()
    })
    
    // Проверяем, что handleProfileSubmit НЕ был вызван (без сохранения)
    expect(mockHandleProfileSubmit).not.toHaveBeenCalled()
  })

  it('сохраняет изменения при успешной отправке формы', async () => {
    const mockHandleProfileSubmit = vi.fn().mockResolvedValue(true)
    
    useProfile.mockReturnValue(createMockUseProfile({
      handleProfileSubmit: mockHandleProfileSubmit
    }))
    
    renderWithRouter(<ProfilePage />)
    
    // Переходим в режим редактирования
    await waitFor(() => {
      const editButton = screen.getByText('Редактировать профиль')
      fireEvent.click(editButton)
    })
    
    // Нажимаем кнопку "Сохранить изменения"
    await waitFor(() => {
      const saveButton = screen.getByText('Сохранить изменения')
      fireEvent.click(saveButton)
    })
    
    // Проверяем, что данные были отправлены
    await waitFor(() => {
      expect(mockHandleProfileSubmit).toHaveBeenCalled()
    })
    
    // После сохранения должны вернуться в режим просмотра
    await waitFor(() => {
      expect(screen.getByText('Редактировать профиль')).toBeInTheDocument()
    })
  })

  it('не закрывает режим редактирования при ошибке сохранения', async () => {
    const mockHandleProfileSubmit = vi.fn().mockResolvedValue(false) // Возвращает false = ошибка
    
    useProfile.mockReturnValue(createMockUseProfile({
      handleProfileSubmit: mockHandleProfileSubmit
    }))
    
    renderWithRouter(<ProfilePage />)
    
    // Переходим в режим редактирования
    await waitFor(() => {
      const editButton = screen.getByText('Редактировать профиль')
      fireEvent.click(editButton)
    })
    
    // Нажимаем кнопку "Сохранить изменения"
    await waitFor(() => {
      const saveButton = screen.getByText('Сохранить изменения')
      fireEvent.click(saveButton)
    })
    
    // Проверяем, что данные были отправлены
    await waitFor(() => {
      expect(mockHandleProfileSubmit).toHaveBeenCalled()
    })
    
    // Форма должна остаться открытой (режим редактирования)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ваше имя')).toBeInTheDocument()
    })
  })
})

