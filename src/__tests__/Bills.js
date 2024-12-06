/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import Bills from '../containers/Bills.js';
import router from "../app/Router";
import { formatDate, formatStatus } from "../app/format.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    describe("When i click on new bill button", () => {
      test("Then it should open the New Bill page", () => {
        // Simule un bouton dans le DOM
        document.body.innerHTML = `<button data-testid="btn-new-bill"></button>`;
        // Mock de la fonction onNavigate
        const onNavigate = jest.fn();

        // Instancie la classe Bills
        new Bills({ document, onNavigate });

        // Récupère le bouton et simule un clic
        document.querySelector('[data-testid="btn-new-bill"]').click();

        // Vérifie que onNavigate a été appelée
        expect(onNavigate).toHaveBeenCalled();
      });
    });
    describe('When I click on the icon eye', () => {
      test('A modal should open', () => {
        // Simule le DOM contenant des icônes iconEye et le modal
        document.body.innerHTML = `
          <div data-testid="icon-eye" data-bill-url="http://example.com/bill"></div>          
        `;

        // Mock de $modal()
        $.fn.modal = jest.fn();

        // Instanciation de la classe Bills
        new Bills({ document });

        // Simulation d'un clic
        document.querySelector('[data-testid="icon-eye"]').click();

        // Vérification que la modal est ouverte
        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    });
  })

  describe("When I arrive on page", () => {
    test("Then it should return stored bills ", async () => {

      //Simulation du store avec les notes de frais
      const mockedStore = {
        bills: jest.fn(() => ({
          list: jest.fn(() => Promise.resolve([{ date: "2024-12-01", status: "pending" }])),
        })),
      };


      const newBill = new Bills({ document, store: mockedStore });

      const bill = await newBill.getBills();

      // Utilise les fonctions de formatage pour correspondre au réel
      expect(bill).toEqual([{ date: formatDate("2024-12-01"), status: formatStatus("pending") },]);
    });
  });
})

//simule API
jest.mock("../app/Store", () => ({
  bills: jest.fn(() => ({
    list: jest.fn(() =>
      Promise.resolve([
        { date: "2024-12-01", status: "pending" },
      ])
    ),
  })),
}));

const mockStore = require("../app/Store");

// test d'intégration GET
describe("Given i am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      //Simule la connection employee
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      //Config DOM
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      //simule le naviagtion vers bills
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      //Vérifie les données
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const headerNotes = screen.getByText("Mes notes de frais");
      expect(headerNotes).toBeTruthy();
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {

        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
        //simule API qui renvoi 404 (page introuvable)
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        //simule API qui renvoi 500 (erreur serveur)
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})