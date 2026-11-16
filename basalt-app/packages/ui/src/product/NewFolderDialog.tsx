import { NameDialog } from "./NameDialog";
import type { NameDialogProps } from "./NameDialog";

type NewFolderDialogProps = NameDialogProps;

function NewFolderDialog(props: NewFolderDialogProps) {
    return <NameDialog {...props} />;
}

export { NewFolderDialog };
export type { NewFolderDialogProps };
