# Подтверждение ТМЦ
from rest_framework.views import APIView

from ..serializers import ConfirmTMCSerializer
from ..permissions import IsStorekeeper
from ..services.commands import ConfirmTMCCommand
from ..services import DomainValidationError
from ..utils import api_response


class ConfirmTMCAPIView(APIView):
    """
    Подтверждение или отклонение ТМЦ кладовщиком.
    Permission: только кладовщик или администратор.
    """
    permission_classes = [IsStorekeeper]

    def post(self, request, item_id):
        """
        Подтвердить или отклонить ТМЦ.
        Транзакция и блокировка — внутри ConfirmTMCCommand.execute().
        """
        serializer = ConfirmTMCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ConfirmTMCCommand.execute(
            item_id=item_id,
            action=serializer.validated_data["action"],
            user=request.user
        )

        return api_response(
            data={"message": "ТМЦ подтверждено"},
            message="Действие выполнено"
        )

