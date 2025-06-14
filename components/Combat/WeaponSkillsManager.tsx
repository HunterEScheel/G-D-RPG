import { cssStyle } from "@/app/styles/phone";
import { calculateSkillCost, calculateTotalSkillCost } from "@/constants/Skills";
import { RootState } from "@/store/rootReducer";
import { updateMultipleFields } from "@/store/slices/baseSlice";
import { updateWeaponSkills } from "@/store/slices/skillsSlice";
import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { ListManager } from "../Common/ListManager";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

export type WeaponSkill = {
    id: number;
    level: number;
    weaponHeft: "Unarmed" | "2-handed" | "1-handed" | "Versatile";
    weaponType: "Stab" | "Swing" | "Fire" | "Draw";
};

const weaponOptions: WeaponSkill[] = [
    {
        weaponHeft: "2-handed",
        id: 1,
        level: 1,
        weaponType: "Stab",
    },
    {
        id: 2,
        level: 1,
        weaponHeft: "2-handed",
        weaponType: "Swing",
    },
    {
        id: 3,
        level: 1,
        weaponHeft: "2-handed",
        weaponType: "Draw",
    },
    {
        id: 4,
        level: 1,
        weaponHeft: "2-handed",
        weaponType: "Fire",
    },
    {
        id: 5,
        level: 1,
        weaponHeft: "1-handed",
        weaponType: "Fire",
    },
    {
        id: 6,
        level: 1,
        weaponHeft: "1-handed",
        weaponType: "Swing",
    },
    {
        id: 7,
        level: 1,
        weaponHeft: "1-handed",
        weaponType: "Stab",
    },
    {
        id: 8,
        level: 1,
        weaponHeft: "1-handed",
        weaponType: "Draw",
    },
    {
        id: 9,
        level: 1,
        weaponHeft: "Unarmed",
        weaponType: "Swing",
    },
    {
        id: 13,
        level: 1,
        weaponHeft: "Versatile",
        weaponType: "Stab",
    },
    {
        id: 14,
        level: 1,
        weaponHeft: "Versatile",
        weaponType: "Swing",
    },
];

export function WeaponSkillManager() {
    const dispatch = useDispatch();
    const { base } = useSelector((state: RootState) => state.character);
    const { weaponSkills } = useSelector((state: RootState) => state.character.skills);
    const [modalVisible, setModalVisible] = useState(false);

    const skills = weaponSkills || [];

    // Calculate total BP spent on skills
    const totalSkillPoints = skills.reduce((total, skill) => {
        return total + calculateTotalSkillCost(skill.level);
    }, 0);

    // Select a suggested skill
    const selectWeaponSkill = (newSkill: WeaponSkill) => {
        // Update skills array with new skill
        const updatedSkills = [...skills, newSkill];
        dispatch(updateWeaponSkills(updatedSkills));

        // Update build points (cost of level 1 skill)
        const costLevel1 = calculateSkillCost(1);
        // Update both buildPointsRemaining and buildPointsSpent
        dispatch(
            updateMultipleFields([
                {
                    field: "buildPointsRemaining",
                    value: base.buildPointsRemaining - costLevel1,
                },
                {
                    field: "buildPointsSpent",
                    value: base.buildPointsSpent + costLevel1,
                },
            ])
        );
        setModalVisible(false); // Close the modal
    };

    const handleLevelChange = (skill: WeaponSkill, increase: boolean) => {
        const updatedSkills = [...skills];
        const index = updatedSkills.findIndex((s) => s.id === skill.id);
        if (index === -1) return;

        const currentLevel = skill.level;
        const newLevel = increase ? currentLevel + 1 : currentLevel - 1;

        // Validate level range (1-10)
        if (newLevel < 1 || newLevel > 10) return;

        // Calculate BP cost difference
        const costDifference = increase ? calculateSkillCost(newLevel) : -calculateSkillCost(currentLevel);

        // Check if player has enough build points for increase
        if (increase && base.buildPointsRemaining < costDifference) {
            Alert.alert("Insufficient Build Points", `You need ${costDifference} build points to increase this skill level.`);
            return;
        }

        // Update the skill level
        updatedSkills[index] = { ...skill, level: newLevel };
        dispatch(updateWeaponSkills(updatedSkills));

        // Update build points
        dispatch(
            updateMultipleFields([
                {
                    field: "buildPointsRemaining",
                    value: base.buildPointsRemaining - costDifference,
                },
                {
                    field: "buildPointsSpent",
                    value: base.buildPointsSpent + costDifference,
                },
            ])
        );
    };

    const handleDeleteSkill = (skill: WeaponSkill) => {
        Alert.alert("Delete Skill", `Are you sure you want to delete this ${skill.weaponHeft} ${skill.weaponType} skill?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    const updatedSkills = skills.filter((s) => s.id !== skill.id);
                    dispatch(updateWeaponSkills(updatedSkills));

                    // Refund build points
                    const refund = calculateTotalSkillCost(skill.level);
                    dispatch(
                        updateMultipleFields([
                            {
                                field: "buildPointsRemaining",
                                value: base.buildPointsRemaining + refund,
                            },
                            {
                                field: "buildPointsSpent",
                                value: base.buildPointsSpent - refund,
                            },
                        ])
                    );
                },
            },
        ]);
    };

    const renderSkillItem = ({ item }: { item: WeaponSkill }) => {
        return (
            <View style={cssStyle.skillItem}>
                <View style={cssStyle.skillInfo}>
                    <ThemedText style={cssStyle.skillName}>
                        {item.weaponHeft} - {item.weaponType}
                    </ThemedText>
                    <ThemedText style={cssStyle.smallText}>Cost: {calculateTotalSkillCost(item.level)} BP</ThemedText>
                </View>
                <View style={cssStyle.skillControls}>
                    <View style={cssStyle.levelContainer}>
                        <Pressable
                            style={[cssStyle.centered, cssStyle.secondaryButton]}
                            onPress={() => handleLevelChange(item, false)}
                            disabled={item.level <= 1}
                        >
                            <ThemedText style={cssStyle.smallButtonText}>-</ThemedText>
                        </Pressable>
                        <View style={cssStyle.levelDisplay}>
                            <ThemedText style={cssStyle.valueText}>{item.level}</ThemedText>
                        </View>
                        <Pressable
                            style={[cssStyle.centered, cssStyle.primaryButton]}
                            onPress={() => handleLevelChange(item, true)}
                            disabled={item.level >= 10}
                        >
                            <ThemedText style={cssStyle.smallButtonText}>+</ThemedText>
                        </Pressable>
                        <Pressable style={[cssStyle.centered, cssStyle.secondaryButton]} onPress={() => handleDeleteSkill(item)}>
                            <ThemedText style={cssStyle.smallButtonText}>×</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <>
            <ListManager<WeaponSkill>
                title="Weapon Skills"
                description={`${totalSkillPoints} BP spent`}
                data={skills}
                renderItem={renderSkillItem}
                keyExtractor={(item) => item.id.toString()}
                onAddPress={() => setModalVisible(true)}
                addButtonText="Add Skill"
                emptyStateText="No skills added yet. Add your first skill!"
            />

            {/* Add Skill Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={cssStyle.modalOverlay}>
                    <ThemedView style={cssStyle.modalView}>
                        <View style={cssStyle.modalHeader}>
                            <ThemedText style={cssStyle.modalTitle}>Add New Skill</ThemedText>
                        </View>

                        <View style={cssStyle.formGroup}>
                            <View style={cssStyle.suggestionsContainer}>
                                <ScrollView>
                                    {weaponOptions.map((weapon, index) => (
                                        <TouchableOpacity key={index} style={cssStyle.suggestionItem} onPress={() => selectWeaponSkill(weapon)}>
                                            <ThemedText>
                                                {weapon.weaponHeft} - {weapon.weaponType}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={cssStyle.costInfoContainer}>
                            <ThemedText>Cost: {calculateSkillCost(1)} BP</ThemedText>
                        </View>

                        <View style={cssStyle.modalButtons}>
                            <Pressable style={cssStyle.secondaryButton} onPress={() => setModalVisible(false)}>
                                <ThemedText style={cssStyle.buttonText}>Cancel</ThemedText>
                            </Pressable>
                        </View>
                    </ThemedView>
                </View>
            </Modal>
        </>
    );
}
