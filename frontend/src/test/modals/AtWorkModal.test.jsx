// test/modals/AtWorkModal.test.jsx - тесты компонента AtWorkModal
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtWorkModal } from '@/components/modals/AtWorkModal';

// Мок axios
vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

// Мок store
const mockStore = {
  lockItem: vi.fn(),
  unlockItem: vi.fn(),
  refreshItems: vi.fn(),
  setSelectedItem: vi.fn(),
  lockedItems: new Set(),
};

vi.mock('@/store/useItemStore', () => ({
  useItemStore: vi.fn(() => mockStore),
}));

// Мок BrigadeModal
vi.mock('@/components/modals/BrigadeModal', () => ({
  BrigadeModal: ({ isOpen, onClose, onSave, isDarkMode }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="brigade-modal">
        <button onClick={onClose}>Close BrigadeModal</button>
        <button onClick={() => onSave({ name: 'Новая бригада', brigadier: 'Тест', responsible: 'Тест2' })}>
          Save Brigade
        </button>
      </div>
    );
  },
}));

// Мок toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';
import { toast } from 'sonner';

describe('AtWorkModal', () => {
  const mockItem = {
    id: 1,
    name: 'Дрель Bosch',
    status: 'issued',
    serial: 'DB123789',
  };

  const mockBrigades = [
    { id: 1, name: 'Бригада 1', brigadier: 'Петров П.П.' },
    { id: 2, name: 'Бригада 2', brigadier: 'Сидоров С.С.' },
    { id: 3, name: 'Бригада 3', brigadier: 'Иванов И.И.' },
  ];

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.lockItem = vi.fn().mockResolvedValue(true);
    mockStore.unlockItem = vi.fn().mockResolvedValue(true);
    mockStore.refreshItems = vi.fn();
    mockStore.setSelectedItem = vi.fn();
    mockStore.lockedItems = new Set();
  });

  describe('Рендеринг', () => {
    it('не должен рендериться когда isOpen=false', () => {
      render(
        <AtWorkModal 
          isOpen={false} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );
      
      expect(screen.queryByText('Выдача ТМЦ в работу')).not.toBeInTheDocument();
    });

    it('не должен рендериться когда selectedItem=null', () => {
      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={null} 
          isDarkMode={false} 
        />
      );
      
      expect(screen.queryByText('Выдача ТМЦ в работу')).not.toBeInTheDocument();
    });

    it('должен рендериться когда isOpen=true и selectedItem передан', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Выдача ТМЦ в работу')).toBeInTheDocument();
      });
    });
  });

  describe('Загрузка данных', () => {
    it('должен загружать бригады при открытии', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/brigades/');
      });
    });

    it('должен показывать загруженные бригады в селекте', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        screen.getByRole('combobox');
      });

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '2');
      expect(select).toHaveValue('2');
    });
  });

  describe('Блокировка ТМЦ', () => {
    it('должен пытаться заблокировать ТМЦ при открытии', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(mockStore.lockItem).toHaveBeenCalledWith(mockItem.id);
      });
    });

    it('должен показывать ошибку если статус ТМЦ не "issued"', async () => {
      const invalidItem = { ...mockItem, status: 'in_stock' };
      
      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={invalidItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "ТМЦ можно передать в работу только из статуса 'Выдано'"
        );
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('должен показывать предупреждение при блокировке другим пользователем', async () => {
      mockStore.lockItem = vi.fn().mockRejectedValue({
        response: { status: 423, data: { locked_by: 'Петров П.П.' } }
      });

      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/заблокирован другим пользователем/i)).toBeInTheDocument();
      });
    });
  });

  describe('Выбор бригады', () => {
    it('должен показывать ошибку валидации при пустом выборе бригады', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Выдача ТМЦ в работу')).toBeInTheDocument();
      });

      // Нажимаем кнопку передачи без выбора бригады
      const submitButton = screen.getByText('Передать в работу');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Выберите бригаду')).toBeInTheDocument();
      });
    });

    it('должен позволять выбрать бригаду из списка', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        screen.getByRole('combobox');
      });

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '2');
      expect(select).toHaveValue('2');
    });
  });

  describe('Создание новой бригады', () => {
    it('должен открывать BrigadeModal при нажатии кнопки "Создать"', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Выдача ТМЦ в работу')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Создать');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('brigade-modal')).toBeInTheDocument();
      });
    });

    it('должен добавлять новую бригаду в список после сохранения', async () => {
      const newBrigade = { id: 4, name: 'Новая бригада', brigadier: 'Тест' };
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });
      api.post.mockResolvedValueOnce({ 
        data: { data: newBrigade } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Выдача ТМЦ в работу')).toBeInTheDocument();
      });

      // Открываем модалку создания бригады
      const createButton = screen.getByText('Создать');
      await userEvent.click(createButton);

      // Сохраняем новую бригаду
      const saveButton = screen.getByText('Save Brigade');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/brigades/', expect.any(Object));
        expect(toast.success).toHaveBeenCalledWith('Бригада создана');
      });
    });
  });

  describe('Передача в работу', () => {
    it('должен вызывать API для передачи ТМЦ при выбранной бригаде', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });
      api.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Выдача ТМЦ в работу')).toBeInTheDocument();
      });

      // Выбираем бригаду
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '2');

      // Нажимаем кнопку передачи
      const submitButton = screen.getByText('Передать в работу');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          `items/${mockItem.id}/`,
          {
            status: 'at_work',
            brigade: '2'
          }
        );
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "ТМЦ успешно передано в работу",
          expect.objectContaining({
            description: expect.stringContaining('2')
          })
        );
      });
    });

    it('должен разблокировать ТМЦ после передачи', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });
      api.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        screen.getByRole('combobox');
      });

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '2');

      const submitButton = screen.getByText('Передать в работу');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.unlockItem).toHaveBeenCalledWith(mockItem.id);
      });
    });

    it('должен обновлять список ТМЦ после передачи', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });
      api.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        screen.getByRole('combobox');
      });

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '2');

      const submitButton = screen.getByText('Передать в работу');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.refreshItems).toHaveBeenCalled();
      });
    });
  });

  describe('Закрытие модалки', () => {
    it('должен разблокировать ТМЦ при закрытии', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Выдача ТМЦ в работу')).toBeInTheDocument();
      });

      // Находим кнопку закрытия (иконка X)
      const closeButton = screen.getByRole('button', { name: '' });
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(mockStore.unlockItem).toHaveBeenCalledWith(mockItem.id);
      });
    });
  });

  describe('Отображение информации о ТМЦ', () => {
    it('должен показывать наименование ТМЦ', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { brigades: mockBrigades } } 
      });

      render(
        <AtWorkModal 
          isOpen={true} 
          onClose={mockOnClose} 
          selectedItem={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Дрель Bosch')).toBeInTheDocument();
      });
    });

    // Примечание: серийный номер (serial) не отображается в текущей версии компонента
    // Тест удалён, так как компонент AtWorkModal не выводит поле serial
  });
});

