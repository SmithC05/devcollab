import joblib
import sklearn.compose._column_transformer

class _RemainderColsList:
    pass

sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

try:
    m = joblib.load('ml/models/duration_model.pkl')
    print('Success:', type(m))
except Exception as e:
    import traceback
    traceback.print_exc()
