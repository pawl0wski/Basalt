import { AppWindowContainer } from "./features/window/AppWindowContainer";
import { WelcomeScreenContainer } from "./features/welcome/WelcomeScreenContainer";

function App() {
    return (
        <AppWindowContainer>
            <WelcomeScreenContainer />
        </AppWindowContainer>
    );
}

export default App;
