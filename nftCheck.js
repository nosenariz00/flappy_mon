// Nueva función para validar si el usuario tiene NFT
export async function checkIfUserHasNFT(contract, userAddress) {
    try {
        if (!contract || !userAddress) {
            console.log("No hay conexión con el contrato o usuario.");
            return false;
        }

        // Llamada al contrato para saber cuántos NFTs tiene
        const balance = await contract.balanceOf(userAddress);

        console.log(`El usuario tiene ${balance.toString()} NFTs`);
        return parseInt(balance.toString()) > 0;
    } catch (error) {
        console.error("Error verificando NFTs:", error);
        return false;
    }
}
