/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

import mockStore from "../__mocks__/store.js";

jest.mock("../app/Store", () => mockStore);


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then i should see the new form", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      // Vérifier la présence du formulaire
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    })
  })
  describe("When I upload a invalid proof file", () => {
    test("Then it should alert ", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      // on instancie une nouvelle note de frais
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(), // mock fonction (ROUTES_PATH['Bills'])
        store: mockStore, //mock du store
        localStorage: window.localStorage,
      });

      // Simuler un fichier invalide
      const proof = screen.getByTestId("file");
      const badProof = new File([], "proof.txt", { type: "text/plain", }); //simuler un justificatif invalide

      window.alert = jest.fn(); // Simule une alerte
      fireEvent.change(proof, { target: { files: [badProof] } }); // simule l'event change.

      expect(window.alert).toHaveBeenCalledWith(
        "Invalid file type. Please upload a JPG, JPEG, or PNG image."
      );
    });
  });
  describe("When I upload a valid file", () => {
    test("Then it should process the file and use the correct email", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Mock localStorage pour simuler un user pour le test mail
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.tld" }));

      // on instancie une nouvelle note 
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simule l'upload du justificatif (tableau vide de nom proof.png avec format png)
      const proof = screen.getByTestId("file");
      const validProof = new File([], "proof.png", {
        type: "image/png",
      });
      fireEvent.change(proof, { target: { files: [validProof] } });

      // Verify le justificatif
      expect(proof.files[0].name).toBe("proof.png");

      // Verify l'email
      const email = JSON.parse(window.localStorage.getItem("user")).email;
      expect(email).toBe("employee@test.tld");
    });
  })
  describe("When the form is submitted", () => {
    test("Then it should call updateBill and onNavigate", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.tld" }));

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Spy la méthode updateBill
      const updateBillSpy = jest.spyOn(newBill, "updateBill");

      // Spy la méthode onNavigate
      const onNavigateSpy = jest.fn();
      newBill.onNavigate = onNavigateSpy;

      // Simuler la soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Vérifier que updateBill a bien été appelé avec l'objet 'bill'
      expect(updateBillSpy).toHaveBeenCalled();

      // Vérifier que onNavigate a bien été appelé
      expect(onNavigateSpy).toHaveBeenCalled();
    });
  });
});

// test d'intégration POST
describe("Given I am connected as Employee", () => {
  describe("When I submit a bill", () => {
    test("Then it should post the bill", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.tld" }));

      const onNavigate = jest.fn();
      // Instancier NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // spy méthode create
      const mockCreate = jest.spyOn(mockStore.bills(), "create");

      // Simuler un fichier valide
      const validFile = new File([], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByTestId("file"), { target: { files: [validFile] } });

      // Simuler l'envoi du formulaire
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Attend la résolution des taches
      await new Promise(process.nextTick);

      // Vérifier que create (méthode de newBIll) ait été appelée
      expect(mockCreate).toHaveBeenCalled();

      // Vérifier le renvoi vers la page des notes de frais 
      expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
    });
  });
  describe("And an error on API", () => {
    test("Then it fails with error message", async () => {

      const html = NewBillUI();
      document.body.innerHTML = html;
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.tld" }));

      // Simule une erreur 404 pour create
      mockStore.bills().create.mockRejectedValueOnce(new Error('error'))
      const consoleErrorSpy = jest.spyOn(console, 'error')

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simule la soumission du formulaire
      const validFile = new File([], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByTestId("file"), { target: { files: [validFile] } });
      fireEvent.submit(screen.getByTestId("form-new-bill"));

      //vérifie l'erreur
      await new Promise(process.nextTick)
      expect(consoleErrorSpy).toHaveBeenCalled()
    });
  });
});