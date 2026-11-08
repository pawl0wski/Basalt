import { AppContainer } from "./features/app/AppContainer";
import { AppWindowContainer } from "./features/window/AppWindowContainer";

function App() {
    return (
        <AppWindowContainer>
            <AppContainer />
        </AppWindowContainer>
    );
}

export default App;
