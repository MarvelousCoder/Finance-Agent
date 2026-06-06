import path from "path";

export function getDataDir() {
    return (
        process.env.DATA_DIR ||
        path.join(
            process.cwd(),
            "data",
            "sample_a"
        )
    );
}