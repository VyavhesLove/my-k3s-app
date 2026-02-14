import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import ItemCreate from '../ItemCreate'
import { useItemStore } from '@/store/useItemStore'
import api from '@/api/axios'
import { toast } from 'sonner'
import '@testing-library/jest-dom'

// Мокаем api
vi.mock('@/api/axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    put: vi.fn().mockResolvedValue({ data: { id: 1 } })
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

// Мокаем sonner
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
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем только наименование (первый input в форме)
    const inputs = document.querySelectorAll('input[type="text"]')
    const nameInput = inputs[0] // Первый input - наименование
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
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем наименование (первый input)
    const inputs = document.querySelectorAll('input[type="text"]')
    const nameInput = inputs[0]
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    // Активируем чекбокс "Серийный номер отсутствует"
    const noSerialCheckbox = screen.getByRole('checkbox')
    fireEvent.click(noSerialCheckbox)
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что НЕ было предупреждения о валидации
    expect(toast.warning).not.toHaveBeenCalledWith(
      'Заполните серийный номер или активируйте чекбокс "Серийный номер отсутствует"'
    )
  })

  it('должен позволить создать ТМЦ с заполненным серийным номером', async () => {
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем наименование (первый input)
    const inputs = document.querySelectorAll('input[type="text"]')
    const nameInput = inputs[0]
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    // Заполняем серийный номер (второй input)
    const serialInput = inputs[1]
    fireEvent.change(serialInput, { target: { value: 'SN123456' } })
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что НЕ было предупреждения о валидации
    expect(toast.warning).not.toHaveBeenCalledWith(
      'Заполните серийный номер или активируйте чекбокс "Серийный номер отсутствует"'
    )
  })

  it('должен позволить создать ТМЦ без брэнда', async () => {
    renderWithRouter(<ItemCreate isDarkMode={false} />)
    
    // Заполняем только наименование и серийный номер (без брэнда)
    const inputs = document.querySelectorAll('input[type="text"]')
    const nameInput = inputs[0]
    fireEvent.change(nameInput, { target: { value: 'Тест ТМЦ' } })
    
    const serialInput = inputs[1]
    fireEvent.change(serialInput, { target: { value: 'SN123456' } })
    
    // Нажимаем кнопку "Создать"
    const submitButton = screen.getByRole('button', { name: /создать/i })
    fireEvent.submit(submitButton)
    
    // Проверяем, что НЕ было предупреждения о валидации
    expect(toast.warning).not.toHaveBeenCalledWith(
      'Заполните серийный номер или активируйте чекбокс "Серийный номер отсутствует"'
    )
  })
})

