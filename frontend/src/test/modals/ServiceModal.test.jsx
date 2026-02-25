// test/modals/ServiceModal.test.jsx - тесты компонента ServiceModal
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceModal } from '@/components/modals/ServiceModal/ServiceModal';
import { serviceSendSchema, serviceConfirmSchema, serviceReturnSchema } from '@/schemas/service';

// Мок axios
vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

// Мок useServiceModal
vi.mock('@/hooks/useServiceModal', () => ({
  useServiceModal: vi.fn(() => ({
    isSend: false,
    isConfirm: true,
    isReturn: false,
    isLocked: true,
    loading: false,
    availableQty: null,
    schema: serviceConfirmSchema,
    title: 'Подтвердить ТМЦ',
    buttonText: 'Подтвердить',
    handleClose: vi.fn(),
    onSubmit: vi.fn(),
    loadQty: vi.fn(),
  })),
}));

// Мок store
const mockStore = {
  selectedItem: null,
  isServiceModalOpen: false,
  setSelectedItem: vi.fn(),
};

vi.mock('@/store/useItemStore', () => ({
  useItemStore: vi.fn(() => mockStore),
}));

// Мок toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    promise: vi.fn(),
  },
}));

import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';
import { useServiceModal } from '@/hooks/useServiceModal';
import { toast } from 'sonner';

describe('ServiceModal', () => {
  const mockItem = {
    id: 1,
    name: 'Принтер HP',
    status: 'confirm',
    serial: 'SN123456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.selectedItem = mockItem;
    mockStore.isServiceModalOpen = true;
  });

  describe('Рендеринг', () => {
    it('не должен рендериться когда isServiceModalOpen=false', () => {
      mockStore.isServiceModalOpen = false;
      
      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.queryByText('Подтвердить ТМЦ')).not.toBeInTheDocument();
    });

    it('не должен рендериться когда selectedItem=null', () => {
      mockStore.selectedItem = null;
      
      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.queryByText('Подтвердить ТМЦ')).not.toBeInTheDocument();
    });

    it('должен рендериться в режиме send', () => {
      useServiceModal.mockReturnValue({
        isSend: true,
        isConfirm: false,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceSendSchema,
        title: 'Отправить в сервис',
        buttonText: 'Отправить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByText('Отправить в сервис')).toBeInTheDocument();
    });

    it('должен рендериться в режиме return', () => {
      useServiceModal.mockReturnValue({
        isSend: false,
        isConfirm: false,
        isReturn: true,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceReturnSchema,
        title: 'Принять из ремонта',
        buttonText: 'Принять',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByText('Принять из ремонта')).toBeInTheDocument();
    });
  });

  describe('Режим send (Отправить в сервис)', () => {
    it('должен показывать поле комментария для причины ремонта', () => {
      useServiceModal.mockReturnValue({
        isSend: true,
        isConfirm: false,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceSendSchema,
        title: 'Отправить в сервис',
        buttonText: 'Отправить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByPlaceholderText(/опишите неисправность/i)).toBeInTheDocument();
    });

    it('должен блокировать поля когда isLocked=false', () => {
      useServiceModal.mockReturnValue({
        isSend: true,
        isConfirm: false,
        isReturn: false,
        isLocked: false,
        loading: false,
        availableQty: null,
        schema: serviceSendSchema,
        title: 'Отправить в сервис',
        buttonText: 'Отправить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByText(/заблокирован другим пользователем/i)).toBeInTheDocument();
    });
  });

  describe('Режим confirm (Подтвердить)', () => {
    it('должен показывать кнопки выбора действия для status=confirm_repair', () => {
      const itemConfirmRepair = { ...mockItem, status: 'confirm_repair' };
      mockStore.selectedItem = itemConfirmRepair;

      useServiceModal.mockReturnValue({
        isSend: false,
        isConfirm: true,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceConfirmSchema,
        title: 'Подтвердить ремонт',
        buttonText: 'Подтвердить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByText('В ремонт')).toBeInTheDocument();
      expect(screen.getByText('Списать')).toBeInTheDocument();
    });

    it('должен показывать условные поля при выборе "В ремонт"', async () => {
      const itemConfirmRepair = { ...mockItem, status: 'confirm_repair' };
      mockStore.selectedItem = itemConfirmRepair;

      useServiceModal.mockReturnValue({
        isSend: false,
        isConfirm: true,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceConfirmSchema,
        title: 'Подтвердить ремонт',
        buttonText: 'Подтвердить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      // Нажимаем на кнопку "В ремонт"
      const repairButton = screen.getByText('В ремонт');
      await userEvent.click(repairButton);
      
      // Проверяем появление полей для ввода
      expect(screen.getByPlaceholderText(/введите номер счета/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/адрес\/название сервиса/i)).toBeInTheDocument();
    });

    it('должен показывать поле причины списания при выборе "Списать"', async () => {
      const itemConfirmRepair = { ...mockItem, status: 'confirm_repair' };
      mockStore.selectedItem = itemConfirmRepair;

      useServiceModal.mockReturnValue({
        isSend: false,
        isConfirm: true,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: 5,
        schema: serviceConfirmSchema,
        title: 'Подтвердить ремонт',
        buttonText: 'Подтвердить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      // Нажимаем на кнопку "Списать"
      const writeOffButton = screen.getByText('Списать');
      await userEvent.click(writeOffButton);
      
      // Проверяем появление поля для причины списания
      expect(screen.getByPlaceholderText(/укажите причину списания/i)).toBeInTheDocument();
    });
  });

  describe('Режим return (Принять из ремонта)', () => {
    it('должен показывать поле комментария для результата обслуживания', () => {
      useServiceModal.mockReturnValue({
        isSend: false,
        isConfirm: false,
        isReturn: true,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceReturnSchema,
        title: 'Принять из ремонта',
        buttonText: 'Принять',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByPlaceholderText(/результат обслуживания/i)).toBeInTheDocument();
    });
  });

  describe('Валидация', () => {
    it('должен показывать ошибку при пустом comment в режиме send', async () => {
      const onSubmit = vi.fn();
      useServiceModal.mockReturnValue({
        isSend: true,
        isConfirm: false,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceSendSchema,
        title: 'Отправить в сервис',
        buttonText: 'Отправить',
        handleClose: vi.fn(),
        onSubmit,
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      // Нажимаем отправить без заполнения комментария
      const submitButton = screen.getByText('Отправить');
      await userEvent.click(submitButton);
      
      // Проверяем ошибку валидации
      await waitFor(() => {
        expect(screen.getByText(/укажите причину/i)).toBeInTheDocument();
      });
    });

    it('должен показывать ошибку при repairAction=confirm без invoiceNumber/location', async () => {
      const itemConfirmRepair = { ...mockItem, status: 'confirm_repair' };
      mockStore.selectedItem = itemConfirmRepair;

      const onSubmit = vi.fn();
      useServiceModal.mockReturnValue({
        isSend: false,
        isConfirm: true,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceConfirmSchema,
        title: 'Подтвердить ремонт',
        buttonText: 'Подтвердить',
        handleClose: vi.fn(),
        onSubmit,
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      // Нажимаем "В ремонт"
      const repairButton = screen.getByText('В ремонт');
      await userEvent.click(repairButton);
      
      // Нажимаем "Подтвердить" без заполнения полей
      const submitButton = screen.getByText('Подтвердить');
      await userEvent.click(submitButton);
      
      // Проверяем ошибку валидации
      await waitFor(() => {
        expect(screen.getByText(/укажите номер счёта/i)).toBeInTheDocument();
      });
    });
  });

  describe('Отображение информации о ТМЦ', () => {
    it('должен показывать информацию о выбранном ТМЦ', () => {
      useServiceModal.mockReturnValue({
        isSend: true,
        isConfirm: false,
        isReturn: false,
        isLocked: true,
        loading: false,
        availableQty: null,
        schema: serviceSendSchema,
        title: 'Отправить в сервис',
        buttonText: 'Отправить',
        handleClose: vi.fn(),
        onSubmit: vi.fn(),
        loadQty: vi.fn(),
      });

      render(<ServiceModal isDarkMode={false} />);
      
      expect(screen.getByText('Принтер HP')).toBeInTheDocument();
      expect(screen.getByText('SN123456')).toBeInTheDocument();
    });
  });
});

