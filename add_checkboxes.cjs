const fs = require('fs');

// --- RegisterScreen ---
let regContent = fs.readFileSync('mobile/src/screens/auth/RegisterScreen.tsx', 'utf8');

if (!regContent.includes('const [agreeTerms, setAgreeTerms]')) {
  regContent = regContent.replace(
    "const [selectedRole, setSelectedRole] = useState('BUYER');\n  const [step, setStep] = useState<1 | 2>(1);",
    "const [selectedRole, setSelectedRole] = useState('BUYER');\n  const [step, setStep] = useState<1 | 2>(1);\n  const [agreeTerms, setAgreeTerms] = useState(false);\n  const [agreeSeller, setAgreeSeller] = useState(false);"
  );

  regContent = regContent.replace(
    "const onSubmit = async (data: FormData) => {",
    "const onSubmit = async (data: FormData) => {\n    const isSeller = ['FARMER', 'TRADER', 'AGGREGATOR', 'PROCESSOR', 'EXPORTER'].includes(selectedRole);\n    if (!agreeTerms) {\n      Alert.alert('Required', 'Please agree to the Terms & Conditions to continue.');\n      return;\n    }\n    if (isSeller && !agreeSeller) {\n      Alert.alert('Required', 'Please confirm the seller declarations to continue.');\n      return;\n    }"
  );

  regContent = regContent.replace(
    "<Button title=\"Create Account\" onPress={handleSubmit(onSubmit)} loading={isLoading} size=\"lg\" style={s.btn} />",
    `<View style={s.checkboxContainer}>
              <TouchableOpacity style={s.checkbox} onPress={() => setAgreeTerms(!agreeTerms)} activeOpacity={0.8}>
                {agreeTerms ? <CheckSquare size={20} color={C.green[700]} /> : <Square size={20} color={C.gray[400]} />}
                <Text style={s.checkboxText}>I agree to the DG-LETS Terms & Conditions and acknowledge the Privacy Policy.</Text>
              </TouchableOpacity>
              
              {['FARMER', 'TRADER', 'AGGREGATOR', 'PROCESSOR', 'EXPORTER'].includes(selectedRole) && (
                <TouchableOpacity style={s.checkbox} onPress={() => setAgreeSeller(!agreeSeller)} activeOpacity={0.8}>
                  {agreeSeller ? <CheckSquare size={20} color={C.green[700]} /> : <Square size={20} color={C.gray[400]} />}
                  <Text style={s.checkboxText}>I confirm that the products I list are genuine, accurately described, legally permitted for sale, and that I have the right to sell them.</Text>
                </TouchableOpacity>
              )}
            </View>
            <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" style={s.btn} />`
  );

  regContent = regContent.replace(
    "loginLink:      { ...Typography.bodyMedium, color: C.green[700], fontWeight: '700' },",
    "loginLink:      { ...Typography.bodyMedium, color: C.green[700], fontWeight: '700' },\n    checkboxContainer: { marginTop: Spacing[2], marginBottom: Spacing[4], gap: Spacing[3] },\n    checkbox:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },\n    checkboxText:   { flex: 1, ...Typography.caption, color: C.textSecondary, lineHeight: 18 },"
  );

  fs.writeFileSync('mobile/src/screens/auth/RegisterScreen.tsx', regContent, 'utf8');
}


// --- CartScreen ---
let cartContent = fs.readFileSync('mobile/src/screens/main/CartScreen.tsx', 'utf8');
if (!cartContent.includes('const [agreeCheckout, setAgreeCheckout]')) {
  cartContent = cartContent.replace(
    "const [showStateList,   setShowStateList]   = useState(false);",
    "const [showStateList,   setShowStateList]   = useState(false);\n  const [agreeCheckout, setAgreeCheckout] = useState(false);"
  );

  cartContent = cartContent.replace(
    "const handlePlaceOrder = () => {\n    if (items.length === 0) return;",
    "const handlePlaceOrder = () => {\n    if (items.length === 0) return;\n    if (!agreeCheckout) {\n      Alert.alert('Required', 'Please confirm your order details and agree to the policies.');\n      return;\n    }"
  );

  cartContent = cartContent.replace(
    "import { Image } from 'expo-image';",
    "import { Image } from 'expo-image';\nimport { CheckSquare, Square } from 'lucide-react-native';"
  );

  cartContent = cartContent.replace(
    "</View>\n          </View>\n        </ScrollView>\n\n        {/* Sticky place order bar */}",
    `</View>\n          </View>\n\n          <View style={s.checkboxContainer}>\n            <TouchableOpacity style={s.checkbox} onPress={() => setAgreeCheckout(!agreeCheckout)} activeOpacity={0.8}>\n              {agreeCheckout ? <CheckSquare size={20} color={C.green[700]} /> : <Square size={20} color={C.gray[400]} />}\n              <Text style={s.checkboxText}>I confirm my order details and agree to the applicable DG-LETS Terms, Payment & Refund Policy.</Text>\n            </TouchableOpacity>\n          </View>\n        </ScrollView>\n\n        {/* Sticky place order bar */}`
  );

  cartContent = cartContent.replace(
    "placeBtn:      { flex: 1, marginLeft: Spacing[4] },",
    "placeBtn:      { flex: 1, marginLeft: Spacing[4] },\n  checkboxContainer: { paddingHorizontal: Spacing[5], marginTop: Spacing[4], marginBottom: Spacing[2] },\n  checkbox:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },\n  checkboxText:   { flex: 1, ...Typography.bodySmall, color: C.textSecondary, lineHeight: 18 },"
  );

  fs.writeFileSync('mobile/src/screens/main/CartScreen.tsx', cartContent, 'utf8');
}
