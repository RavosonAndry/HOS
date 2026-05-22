import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ""))
from core.wsgi import application

app = application
