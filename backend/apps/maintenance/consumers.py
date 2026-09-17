import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer  # type: ignore

class AlertConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for handling real-time alert notifications.
    Connected clients are added to global, company, and user-specific groups.
    """
    async def connect(self):
        user = self.scope.get("user")
        
        # Allow connection if user is authenticated
        if user and user.is_authenticated:
            self.user_group = f"user_{user.id}"
            await self.channel_layer.group_add(self.user_group, self.channel_name)
            
            # Broadcast group for all connected authenticated users
            await self.channel_layer.group_add("global_alerts", self.channel_name)

            # Broadcast group for company-wide alerts
            if hasattr(user, "entreprise") and user.entreprise:
                self.entreprise_group = f"entreprise_{user.entreprise.id}"
                await self.channel_layer.group_add(self.entreprise_group, self.channel_name)

            await self.accept()
        else:
            # Reject unauthenticated connections
            await self.close()

    async def disconnect(self, code):
        user = self.scope.get("user")
        if user and user.is_authenticated:
            await self.channel_layer.group_discard("global_alerts", self.channel_name)
            if hasattr(self, "user_group"):
                await self.channel_layer.group_discard(self.user_group, self.channel_name)
            if hasattr(self, "entreprise_group"):
                await self.channel_layer.group_discard(self.entreprise_group, self.channel_name)

    async def alert_created(self, event):
        """
        Handler for alert_created events sent by group_send from signals.
        """
        await self.send_json({
            "type": "alert_created",
            "data": event["data"],
        })
