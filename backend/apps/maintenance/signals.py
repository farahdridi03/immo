from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer  # type: ignore
from .models import Alerte
from .serializers import AlerteSerializer

@receiver(post_save, sender=Alerte)
def notify_alert_created(sender, instance, created, **kwargs):
    """
    Signal receiver triggered when a new Alerte is created.
    Broadcasts the newly created alert in real time over WebSockets via Django Channels.
    """
    if created:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        try:
            data = AlerteSerializer(instance).data
        except Exception as e:
            data = {
                "id": instance.id,
                "type_alerte": instance.type_alerte,
                "type_alerte_display": instance.get_type_alerte_display() if hasattr(instance, "get_type_alerte_display") else instance.type_alerte,
                "message": instance.message,
                "lien_cible": instance.lien_cible,
                "date_alerte": instance.date_alerte.isoformat() if instance.date_alerte else "",
                "statut_lecture": instance.statut_lecture,
                "destinataire": instance.destinataire_id,
            }

        # Send to specific user group if destinataire exists
        if instance.destinataire_id:
            user_group = f"user_{instance.destinataire_id}"
            async_to_sync(channel_layer.group_send)(
                user_group,
                {
                    "type": "alert_created",
                    "data": data,
                },
            )

        # Also send to global_alerts group
        async_to_sync(channel_layer.group_send)(
            "global_alerts",
            {
                "type": "alert_created",
                "data": data,
            },
        )
