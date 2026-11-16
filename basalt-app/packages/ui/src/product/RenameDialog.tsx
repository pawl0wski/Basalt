import { NameDialog } from "./NameDialog";
import type { NameDialogProps } from "./NameDialog";

type RenameDialogProps = NameDialogProps & {
    currentName: string;
};

function RenameDialog({ currentName, ...props }: RenameDialogProps) {
    return (
        <NameDialog
            {...props}
            submitDisabled={props.submitDisabled || props.name === currentName}
        />
    );
}

export { RenameDialog };
export type { RenameDialogProps };
