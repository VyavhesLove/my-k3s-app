# Подтверждение ТМЦ
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from ..serializers import ConfirmTMCSerializer
from ..permissions import IsStorekeeper
from ..services.commands import ConfirmTMCCommand
from ..services.domain.exceptions import DomainValidationError
from ..models import Item


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

        try:
            ConfirmTMCCommand.execute(
                item_id=item_id,
                action=serializer.validated_data["action"],
                user=request.user
            )
        except Item.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        except DomainValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True})

