import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { products } from '../data/mockData';

export const uploadMockDataToFirestore = async () => {
    console.log("Starting upload of mock data to Firestore...");
    try {
        const productsRef = collection(db, 'products');

        // 1. Wipe existing products
        console.log("Wiping existing products...");
        const snapshot = await getDocs(productsRef);
        let deletedCount = 0;
        for (const document of snapshot.docs) {
            await deleteDoc(doc(db, 'products', document.id));
            deletedCount++;
        }
        console.log(`Deleted ${deletedCount} existing products.`);

        // 2. Upload new products
        let count = 0;
        for (const product of products) {
            // Use the product ID from mockData as the Firestore Document ID
            const docRef = doc(productsRef, product.id.toString());
            await setDoc(docRef, product);
            count++;
            console.log(`Uploaded product ${product.id}`);
        }

        console.log(`Successfully uploaded ${count} products to Firestore!`);
        return { success: true, count };
    } catch (error) {
        console.error("Error uploading data: ", error);
        return { success: false, error };
    }
};
