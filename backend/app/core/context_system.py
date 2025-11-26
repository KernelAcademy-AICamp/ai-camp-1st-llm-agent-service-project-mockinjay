from Agent.session_manager import SessionManager
from Agent.context_engineer import ContextEngineer

class ContextSystem:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ContextSystem, cls).__new__(cls)
            cls._instance.session_manager = SessionManager()
            cls._instance.context_engineer = ContextEngineer()
        return cls._instance

context_system = ContextSystem()
