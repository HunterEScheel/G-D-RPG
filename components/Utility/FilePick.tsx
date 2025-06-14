import { Character, setCharacter } from "@/store/slices/characterSlice";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import React, { useState } from "react";
import { Button, Platform, Text, View } from "react-native";
import { useDispatch } from "react-redux";

interface ImportFileProps {
  onImportSuccess?: () => void;
}

export const ImportFile = ({ onImportSuccess }: ImportFileProps) => {
  const [filePath, setFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const dispatch = useDispatch();

  const handleFileSelection = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "text/plain",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setFilePath(uri);

      try {
        const content = await FileSystem.readAsStringAsync(uri);
        setFileContent(content);

        try {
          const parsed = JSON.parse(content);

          // Basic validation check: does it have expected keys?
          dispatch(setCharacter(parsed as Character));
          console.log("Parsed character:", parsed);

          // Call the success callback if provided
          if (onImportSuccess) {
            onImportSuccess();
          }
        } catch (parseErr) {
          console.error("Invalid JSON format:", parseErr);
        }
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Select File" onPress={handleFileSelection} />
      <Text selectable style={{ marginTop: 10 }}>
        Selected File: {filePath}
      </Text>
      <Text selectable numberOfLines={8} style={{ marginTop: 10 }}>
        Raw Content: {fileContent}
      </Text>
    </View>
  );
};

export const saveCharacter = async (fileName: string, fileContent: Character) => {
  if (!FileSystem.documentDirectory) {
    console.error("No document directory available!");
    return;
  }

  const fileUri = `${FileSystem.documentDirectory}${fileName}.txt`;
  console.log("Attempting to write to:", fileUri);

  try {
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(fileContent));
    console.log(`File created: ${fileUri}`);

    await saveFile(fileUri, fileName, "text/plain");
  } catch (error: any) {
    console.error("File write failed:", error.message || error.toString());
  }
};

async function saveFile(uri: string, fileName: string, mimeType: string) {
  if (Platform.OS === "android") {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, mimeType);

        await FileSystem.writeAsStringAsync(newFileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("File successfully saved to user directory.");
      } else {
        console.warn("Permission denied, falling back to sharing.");
        await shareFile(uri);
      }
    } catch (err) {
      console.error("Error saving file:", err);
      await shareFile(uri);
    }
  } else {
    await shareFile(uri);
  }
}

async function shareFile(uri: string) {
  if (await isAvailableAsync()) {
    await shareAsync(uri);
  } else {
    console.warn("Sharing is not available on this platform.");
  }
}
