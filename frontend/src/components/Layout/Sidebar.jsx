import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, CalendarCheck,
  Wrench, Brain, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/clients',       icon: Users,           label: 'Clients'         },
  { to: '/vehicules',     icon: Car,             label: 'Véhicules'       },
  { to: '/reservations',  icon: CalendarCheck,   label: 'Réservations'    },
  { to: '/maintenances',  icon: Wrench,          label: 'Maintenances'    },
  { to: '/predictions',   icon: Brain,           label: 'Prédictions ML'  },
];

export default function Sidebar() {
  const { utilisateur, logout } = useAuth();

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Car className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Smart ERP 4.0</h1>
            <p className="text-gray-400 text-xs">Location véhicules</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-50" />
          </NavLink>
        ))}
      </nav>

      {/* Utilisateur connecté */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {utilisateur?.nom?.charAt(0) || 'A'}
            </span>
          </div>
          <div>
            <p className="text-white text-xs font-medium">{utilisateur?.nom}</p>
            <p className="text-gray-400 text-xs capitalize">{utilisateur?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-xs px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut size={14} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}