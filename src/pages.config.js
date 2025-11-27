import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Leaders from './pages/Leaders';
import Demands from './pages/Demands';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Contacts": Contacts,
    "Leaders": Leaders,
    "Demands": Demands,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};