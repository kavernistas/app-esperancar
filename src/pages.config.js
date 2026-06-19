import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Leaders from './pages/Leaders';
import Demands from './pages/Demands';
import ElectoralMap from './pages/ElectoralMap';
import StrategicPlanning from './pages/StrategicPlanning';
import Reports from './pages/Reports';
import Campaigns from './pages/Campaigns';
import ElectoralConsult from './pages/ElectoralConsult';
import Gamification from './pages/Gamification';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Contacts": Contacts,
    "Leaders": Leaders,
    "Demands": Demands,
    "ElectoralMap": ElectoralMap,
    "StrategicPlanning": StrategicPlanning,
    "Reports": Reports,
    "Campaigns": Campaigns,
    "ElectoralConsult": ElectoralConsult,
    "Gamification": Gamification,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};