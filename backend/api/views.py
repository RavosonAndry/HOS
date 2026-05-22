from rest_framework.response import Response
from rest_framework.views import APIView

from .hos_engine import calculate_hos_trip  # Ta logique métier
from .serializers import TripInputSerializer


class GenerateTripView(APIView):
    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        if serializer.is_valid():
            # Ici tu appelleras ton API de Geocoding (ex: OpenStreetMap) 
            # pour transformer les noms de villes en coordonnées/distance
            data = serializer.validated_data
            
            # Simulation de calcul
            result = calculate_hos_trip(
                data['currentLocation'],
                data['pickupLocation'],
                data['dropoffLocation'],
                data['currentCycleUsed']
            )
            return Response(result)
        return Response(serializer.errors, status=400)
