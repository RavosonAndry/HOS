from rest_framework import serializers


class TripInputSerializer(serializers.Serializer):
    currentLocation = serializers.CharField(max_length=255)
    pickupLocation = serializers.CharField(max_length=255)
    dropoffLocation = serializers.CharField(max_length=255)
    currentCycleUsed = serializers.FloatField(min_value=0.0, max_value=70.0)
