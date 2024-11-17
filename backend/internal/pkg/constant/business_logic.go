package constant

const (
	Size_Male_S = iota
	Size_Male_M
	Size_Male_L
	Size_Male_XL
	Size_Male_2XL
	Size_Male_3XL
	Size_Male_4XL
	Size_Male_5XL
	Size_Female_S
	Size_Female_M
	Size_Female_L
	Size_Female_XL
	Size_Female_2XL
	Size_Female_3XL
)

const (
	He = iota
	She
	They
)

const (
	Male = iota
	Female
	NonBinaryGender
)

const (
	Level_A = iota
	Level_B
)

const (
	Proficiency_NotAtAll = iota
	Proficiency_Somewhat
	Proficiency_Yes
)

func GetSizeDescription(size int) string {
	switch size {
	case Size_Male_S:
		return "Male S"
	case Size_Male_M:
		return "Male M"
	case Size_Male_L:
		return "Male L"
	case Size_Male_XL:
		return "Male XL"
	case Size_Male_2XL:
		return "Male 2XL"
	case Size_Male_3XL:
		return "Male 3XL"
	case Size_Male_4XL:
		return "Male 4XL"
	case Size_Male_5XL:
		return "Male 5XL"
	case Size_Female_S:
		return "Female S"
	case Size_Female_M:
		return "Female M"
	case Size_Female_L:
		return "Female L"
	case Size_Female_XL:
		return "Female XL"
	case Size_Female_2XL:
		return "Female 2XL"
	case Size_Female_3XL:
		return "Female 3XL"
	default:
		return "Unknown Size"
	}
}

func GetPronounDescription(pronoun int) string {
	switch pronoun {
	case He:
		return "He/Him"
	case She:
		return "She/Her"
	case They:
		return "They/Them"
	default:
		return "Unknown Pronoun"
	}
}

func GetGenderDescription(gender int) string {
	switch gender {
	case Male:
		return "Male"
	case Female:
		return "Female"
	case NonBinaryGender:
		return "Non-Binary"
	default:
		return "Unknown Gender"
	}
}
