
  # Lebensmittelrettungs-App

  This is a code bundle for Lebensmittelrettungs-App. The original project is available at https://www.figma.com/design/VmSxB8WKsu3de35WYOByUm/Lebensmittelrettungs-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ### Local Ollama integration

  1. Start your Ollama server locally:
     ```bash
     ollama serve --host 127.0.0.1 --port 11434
     ```
  2. Start the local backend proxy:
     ```bash
     npm run serve:llm
     ```
  3. Open the app and verwende den neuen KI-Assistenten auf der Startseite.

  Optional: Wenn du ein anderes Modell verwenden möchtest, setze `OLLAMA_MODEL` vor dem Start:
  ```bash
  OLLAMA_MODEL=llama2 npm run serve:llm
  ```
  