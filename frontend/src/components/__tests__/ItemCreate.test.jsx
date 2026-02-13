import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import ItemCreate from '../ItemCreate'
import { useItemStore } from '@/store/useItemStore'
import '@testing-library/jest-dom'

// Мокаем api
vi.mock('@/api/axios', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn()
  }
}))

// Мокаем useItemStore
vi.mock('@/store/useItemStore', () => ({
  useItemStore: vi.fn(() => ({
    refreshItems: vi.fn()
  }))
}))

// Мокаем react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

// Мокаем toast из sonner
vi.mock('sonner', () => ({
  toast: {
    promise: vi.fn((promise, options) => {
      return promise.then(() => options.success()).catch(() => {})
    }),
    warning: vi.fn()
  }
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ItemCreate - Валидация серийного номера', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('должен показать предупреждение при попытке создать ТМЦ без серийного номера и без чекбокса', async () => {
    const { toast } = await import('sonner')
    
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем только наименование
    const nameInput = screen.getByLabelText(/наименование/i)
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что появилось предупреждение
    expect(toast.warning).toHaveBeenCalledWith(
      'Заполните серийный номер или активируйте чекбокс "Серийный номер отсутствует"'
    )
  })

  it('должен позволить создать ТМЦ без серийного номера, если чекбокс активен', async () => {
    const { toast, default: api } = await import('sonner')
    api.post = vi.fn().mockResolvedValue({ data: { id: 1 } })
    
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем наименование
    const nameInput = screen.getByLabelText(/наименование/i)
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    // Активируем чекбокс "Серийный номер отсутствует"
    const noSerialCheckbox = screen.getByLabelText(/серийный номер отсутствует/i)
    fireEvent.click(noSerialCheckbox)
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что НЕ было предупреждения
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('должен позволить создать ТМЦ с заполненным серийным номером', async () => {
    const { toast, default: api } = await import('sonner')
    api.post = vi.fn().mockResolvedValue({ data: { id: 1 } })
    
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем наименование
    const nameInput = screen.getByLabelText(/наименование/i)
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    // Заполняем серийный номер
    const serialInput = screen.getByLabelText(/серийный номер/i)
    fireEvent.change(serialInput, { target: { value: 'SN123456' } })
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что НЕ было предупреждения
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('должен позволить создать ТМЦ без брэнда', async () => {
    const { toast, default: api } = await import('sonner')
    api.post = vi.fn().mockResolvedValue({ data: { id: 1 } })
    
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем только наименование и серийный номер (без брэнда)
    const nameInput = screen.getByLabelText(/наименование/i)
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    const serialInput = screen.getByLabelText(/серийный номер/i)
    fireEvent.change(serialInput, { target: { value: 'SN123456' } })
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что НЕ было предупреждения
    expect(toast.warning).not.toHaveBeenCalled()
  })
})

